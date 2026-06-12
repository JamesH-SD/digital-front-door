import { Tenant } from "@/lib/types/tenant";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a tenant by slug from Supabase.
 */
export async function getTenantBySlug(
  slug: string
): Promise<Tenant | null> {
  if (!slug) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching tenant:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    businessName: data.business_name,
    primaryPhone: data.primary_phone,
    email: data.email,
    bookingType: data.booking_type ?? null,
    nextStepMessage: data.next_step_message ?? null,
    websiteUrl: data.website_url,
    primaryCategory: data.primary_category,
    isServiceAreaBusiness: data.is_service_area_business,
    addressLine1: data.address_line1,
    addressLine2: data.address_line2,
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: data.country,
    serviceAreaSummary: data.service_area_summary,
    serviceRadiusMiles: data.service_radius_miles,
    serviceCities: data.service_cities || [],
    excludedServiceCities: data.excluded_service_cities || [],
    outOfAreaMessage: data.out_of_area_message,
    tagline: data.tagline,
    aboutUs: data.about_us,
    licenseNumber: data.license_number,
    isInsured: data.is_insured ?? false,
    shareBusinessAddressInChat: data.share_business_address_in_chat ?? false,
    servicesOffered: data.services_offered || [],
    hours: data.hours || {},
    greetingMessage: data.greeting_message,
    askForTimeline: data.ask_for_timeline,
    askForEmailAfterPhone: data.ask_for_email_after_phone,
    askForImagesAfterCapture: data.ask_for_images_after_capture,
    requirePhoneForLead: data.require_phone_for_lead,
    websiteSettings: data.website_settings || {},
  };
}