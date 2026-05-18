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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenants")
      .update({
        // ===============================
        // GBP_COMPATIBLE: Business Identity
        // ===============================
        business_name: body.businessName,
        primary_phone: body.primaryPhone,
        email: body.email,
        website_url: body.websiteUrl,
        primary_category: body.primaryCategory,

        // ===============================
        // GBP_COMPATIBLE: Location / Service Area
        // ===============================
        is_service_area_business: body.isServiceAreaBusiness,
        address_line1: body.addressLine1,
        city: body.city,
        state: body.state,
        zip: body.zip,
        service_area_summary: body.serviceAreaSummary,
        service_cities: body.serviceCities,
        out_of_area_message: body.outOfAreaMessage,

                // ===============================
        // GBP_COMPATIBLE: Business Profile
        // ===============================
        tagline: body.tagline,
        about_us: body.aboutUs,
        license_number: body.licenseNumber,
        is_insured: body.isInsured,
        share_business_address_in_chat: body.shareBusinessAddressInChat,

        // ===============================
        // GBP_COMPATIBLE: Services + Hours
        // ===============================
        services_offered: body.servicesOffered,
        hours: body.hours,

        // ===============================
        // Chat Settings
        // ===============================
        booking_type: body.bookingType,
        next_step_message: body.nextStepMessage,
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
      console.error("Error updating tenant settings:", error.message);

      return NextResponse.json(
        { error: "Failed to update tenant settings." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected settings update error:", error);

    return NextResponse.json(
      { error: "Unexpected server error while saving settings." },
      { status: 500 }
    );
  }
}