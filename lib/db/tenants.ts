import { Tenant } from "@/lib/types/tenant";

const mockTenants: Tenant[] = [
  {
    id: "1",
    slug: "hughes-general",
    businessName: "Hughes General",
    tagline: "Fast, reliable framing for remodels and additions.",
    logoUrl: null,
    primaryColor: "#1d4ed8",
    phone: "(619) 549-0891",
    email: "james@hughesgeneral.com",
    city: "Vista",
    state: "CA",
    serviceAreaSummary: "Serving San Diego County",
    isActive: true,
  },
  {
    id: "2",
    slug: "elite-electric",
    businessName: "Elite Electric",
    tagline: "Residential and light commercial electrical work.",
    logoUrl: null,
    primaryColor: "#f59e0b",
    phone: "(555) 222-3333",
    email: "info@eliteelectric.com",
    city: "Temecula",
    state: "CA",
    serviceAreaSummary: "Serving Riverside and North San Diego County",
    isActive: true,
  },
];

export async function getTenantBySlug(
  slug: string
): Promise<Tenant | null> {
  const tenant = mockTenants.find(
    (item) => item.slug.toLowerCase() === slug.toLowerCase() && item.isActive
  );

  return tenant ?? null;
}