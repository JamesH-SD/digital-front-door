import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to create a tenant." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";

  const tenantSlug = slugify(
    typeof body.tenantSlug === "string" ? body.tenantSlug : businessName
  );

  if (!businessName || !tenantSlug) {
    return NextResponse.json(
      { error: "Business name and tenant slug are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existingTenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (existingTenant) {
    return NextResponse.json(
      { error: "That business slug is already taken." },
      { status: 409 }
    );
  }

  const { error: tenantError } = await supabase.from("tenants").insert({
    slug: tenantSlug,
    name: businessName,
    business_name: businessName,
    greeting_message: `Hi! Welcome to ${businessName}. How can we help you today?`,
    ask_for_timeline: true,
    ask_for_email_after_phone: false,
    ask_for_images_after_capture: true,
    require_phone_for_lead: true,
    is_service_area_business: true,
    services_offered: [],
    service_cities: [],
    hours: {},
  });

  if (tenantError) {
    console.error("Create tenant error:", tenantError.message);

    return NextResponse.json(
      { error: tenantError.message },
      { status: 500 }
    );
  }

  const { error: membershipError } = await supabase
    .from("tenant_memberships")
    .insert({
      tenant_slug: tenantSlug,
      user_id: user.id,
      role: "owner",
    });

  if (membershipError) {
    console.error("Create tenant membership error:", membershipError.message);

    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    tenantSlug,
  });
}