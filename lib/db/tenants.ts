import { Tenant } from "@/lib/types/tenant";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a tenant by slug from Supabase.
 */
export async function getTenantBySlug(
  slug: string
): Promise<Tenant | null> {
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
    businessName: data.business_name || data.name || "",
    tagline: data.tagline || "",
    logoUrl: data.logo_url || null,
    primaryColor: data.primary_color || "#1d4ed8",
    phone: data.phone || "",
    email: data.email || "",
    city: data.city || "",
    state: data.state || "",
    serviceAreaSummary: data.service_area_summary || "",
    isActive: data.is_active ?? true,
  };
}