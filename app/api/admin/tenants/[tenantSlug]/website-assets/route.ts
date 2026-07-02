import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

type AssetType =
  | "logo"
  | "favicon"
  | "hero"
  | "whyUs"
  | "about"
  | "gallery"
  | "service";

  function getSettingsKey(assetType: AssetType) {
    switch (assetType) {
      case "logo":
        return "logoUrl";
      case "favicon":
        return "faviconUrl";
      case "hero":
        return "heroImageUrl";
      case "whyUs":
        return "whyUsImageUrl";
      case "about":
        return "aboutImageUrl";
      default:
        return null;
    }
  }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantSlug } = await params;
    const formData = await request.formData();

    const file = formData.get("file");
    const assetType = (formData.get("assetType") || "logo") as AssetType;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be PNG, JPG, WEBP, or SVG." },
        { status: 400 }
      );
    }

    if (file.size > 1024 * 1024 * 2) {
      return NextResponse.json(
        { error: "Image must be under 2MB." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const extension = file.name.split(".").pop() || "png";
    const safeAssetType = assetType || "logo";
    const path = `${tenantSlug}/${safeAssetType}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("website-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("website-assets")
      .getPublicUrl(path);

    const imageUrl = publicUrlData.publicUrl;

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("website_settings")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError) {
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    const currentSettings = tenant?.website_settings || {};
    const settingsKey = getSettingsKey(safeAssetType);

    const nextWebsiteSettings = settingsKey
      ? {
          ...currentSettings,
          [settingsKey]: imageUrl,
        }
      : currentSettings;

    if (settingsKey) {
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          website_settings: nextWebsiteSettings,
        })
        .eq("slug", tenantSlug);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      imageUrl,
      logoUrl: safeAssetType === "logo" ? imageUrl : undefined,
      websiteSettings: nextWebsiteSettings,
    });
  } catch (error) {
    console.error("Website asset upload error:", error);

    return NextResponse.json(
      { error: "Unexpected error uploading image." },
      { status: 500 }
    );
  }
}