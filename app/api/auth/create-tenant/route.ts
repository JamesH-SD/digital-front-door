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

function generateTenantCode(businessName: string) {
  const letters = businessName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 4);

  const prefix = letters || "DFD";
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${random}`;
}

async function makeUniqueSlug(baseSlug: string) {
  const supabase = createAdminClient();

  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const { data } = await supabase
      .from("tenants")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to create a tenant." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));

  const metadataBusinessName =
    typeof user.user_metadata?.business_name === "string"
      ? user.user_metadata.business_name.trim()
      : "";

  const metadataEmail =
    typeof user.email === "string" ? user.email.trim() : "";

  const businessName =
    typeof body.businessName === "string" && body.businessName.trim()
      ? body.businessName.trim()
      : metadataBusinessName;

  const baseSlug = slugify(
    typeof body.tenantSlug === "string" && body.tenantSlug.trim()
      ? body.tenantSlug
      : businessName
  );

  if (!businessName || !baseSlug) {
    return NextResponse.json(
      { error: "Business name is required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existingMembership } = await supabase
    .from("tenant_memberships")
    .select("tenant_slug, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.tenant_slug) {
    return NextResponse.json({
      tenantSlug: existingMembership.tenant_slug,
      alreadyExists: true,
    });
  }

  const tenantSlug = await makeUniqueSlug(baseSlug);
  const tenantCode = generateTenantCode(businessName);

  const { error: tenantError } = await supabase.from("tenants").insert({
    slug: tenantSlug,
    tenant_code: tenantCode,
    name: businessName,
    business_name: businessName,
    email: metadataEmail || null,
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

    return NextResponse.json({ error: tenantError.message }, { status: 500 });
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

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error: billingError } = await supabase.from("tenant_billing").insert({
    tenant_slug: tenantSlug,
    subscription_status: "trialing",
    trial_ends_at: trialEndsAt.toISOString(),
  });

  if (billingError) {
    console.error("Create tenant billing error:", billingError.message);

    return NextResponse.json(
      { error: billingError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    tenantSlug,
    alreadyExists: false,
  });
}