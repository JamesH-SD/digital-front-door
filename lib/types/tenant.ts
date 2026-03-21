export type Tenant = {
  id: string;
  slug: string;
  businessName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  serviceAreaSummary?: string | null;
  isActive: boolean;
};