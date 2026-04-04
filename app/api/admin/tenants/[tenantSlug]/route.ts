import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: Request, { params }: any) {
  const { tenantSlug } = params;
  const body = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("tenants")
    .update({
      primary_phone: body.primaryPhone,
      email: body.email,
      website_url: body.websiteUrl,
      primary_category: body.primaryCategory,

      is_service_area_business: body.isServiceAreaBusiness,
      address_line1: body.addressLine1,
      city: body.city,
      state: body.state,
      zip: body.zip,
      service_area_summary: body.serviceAreaSummary,
      service_cities: body.serviceCities,
      out_of_area_message: body.outOfAreaMessage,

      tagline: body.tagline,
      about_us: body.aboutUs,
      license_number: body.licenseNumber,

      services_offered: body.servicesOffered,

      greeting_message: body.greetingMessage,
      ask_for_timeline: body.askForTimeline,
      ask_for_email_after_phone: body.askForEmailAfterPhone,
      ask_for_images_after_capture: body.askForImagesAfterCapture,
      require_phone_for_lead: body.requirePhoneForLead,
    })
    .eq("slug", tenantSlug)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}