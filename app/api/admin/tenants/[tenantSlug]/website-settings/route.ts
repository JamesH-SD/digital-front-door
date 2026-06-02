import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { tenantSlug } = await context.params;
    const body = await request.json();

    const websiteSettings = body.websiteSettings;

    if (!websiteSettings || typeof websiteSettings !== "object") {
      return NextResponse.json(
        { error: "websiteSettings is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenants")
      .update({
        website_settings: websiteSettings,
      })
      .eq("slug", tenantSlug)
      .select("website_settings")
      .single();

    if (error) {
      console.error("Failed saving website settings:", error);
      return NextResponse.json(
        { error: "Failed to save website settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      websiteSettings: data.website_settings,
    });
  } catch (error) {
    console.error("Website settings route error:", error);
    return NextResponse.json(
      { error: "Unexpected error saving website settings." },
      { status: 500 }
    );
  }
}