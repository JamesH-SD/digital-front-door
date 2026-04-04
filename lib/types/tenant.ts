export type Tenant = {
  id: string;
  slug: string;

  // ===============================
  // GBP_COMPATIBLE: Business Identity
  // ===============================
  businessName: string;
  primaryPhone?: string;
  email?: string;
  websiteUrl?: string;
  primaryCategory?: string;

  // ===============================
  // GBP_COMPATIBLE: Location / Service Area
  // ===============================
  isServiceAreaBusiness?: boolean;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  serviceAreaSummary?: string;
  serviceCities?: string[];
  outOfAreaMessage?: string;

  // ===============================
  // GBP_COMPATIBLE: Business Profile
  // ===============================
  tagline?: string;
  aboutUs?: string;
  licenseNumber?: string;

  // ===============================
  // GBP_COMPATIBLE: Services
  // ===============================
  servicesOffered?: string[];

  // ===============================
  // GBP_COMPATIBLE: Hours
  // ===============================
  hours?: Record<string, any>;

  // ===============================
  // Chat Settings (Product Layer)
  // ===============================
  greetingMessage?: string;
  askForTimeline?: boolean;
  askForEmailAfterPhone?: boolean;
  askForImagesAfterCapture?: boolean;
  requirePhoneForLead?: boolean;

  // ===============================
  // Existing / UI Support Fields
  // ===============================
  primaryColor?: string;
};