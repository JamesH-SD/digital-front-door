import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantSlug } = await params;
    const body = await request.json();

    const action = body.action as "publish" | "unpublish";

    if (action !== "publish" && action !== "unpublish") {
      return NextResponse.json(
        { error: "Invalid publish action." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const nextStatus = action === "publish" ? "published" : "draft";

    const { data, error } = await supabase
      .from("tenants")
      .update({
        website_status: nextStatus,
        website_published_at:
          action === "publish" ? new Date().toISOString() : null,
      })
      .eq("slug", tenantSlug)
      .select("website_status, website_published_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      websiteStatus: data.website_status,
      websitePublishedAt: data.website_published_at,
    });
  } catch (error) {
    console.error("Website publish route error:", error);

    return NextResponse.json(
      { error: "Unexpected error updating website status." },
      { status: 500 }
    );
  }
}