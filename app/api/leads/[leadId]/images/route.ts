import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLeadById, updateLead } from "@/lib/db/leads";
import { createLeadActivity } from "@/lib/db/lead-activities";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const formData = await request.formData();

    const tenantSlug = formData.get("tenantSlug");
    const file = formData.get("file");

    if (typeof tenantSlug !== "string" || !tenantSlug.trim()) {
      return NextResponse.json(
        { error: "tenantSlug is required" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    const maxBytes = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "File must be 5MB or smaller." },
        { status: 400 }
      );
    }

    const lead = await getLeadById(leadId);

    if (!lead || lead.tenantSlug !== tenantSlug) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const supabase = createAdminClient();

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${tenantSlug}/${leadId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("lead-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);

      return NextResponse.json(
        { error: uploadError.message || "Failed to upload to storage" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("lead-images")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to generate public URL" },
        { status: 500 }
      );
    }

    const newImage = {
      id: crypto.randomUUID(),
      url: publicUrlData.publicUrl,
      filename: file.name,
    };

    const updatedLead = await updateLead(leadId, {
      images: [...(lead.images || []), newImage],
    });
    
    try {
      await createLeadActivity({
        leadId,
        tenantSlug,
        eventType: "lead.image_uploaded",
        eventSource: "customer",
        metadata: {
          imageId: newImage.id,
          imageUrl: newImage.url,
          filename: newImage.filename ?? null,
        },
      });
    } catch (error) {
      console.error("Non-fatal image activity error:", error);
    }
    
    return NextResponse.json({
      image: newImage,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("POST /api/leads/[leadId]/images error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 }
    );
  }
}