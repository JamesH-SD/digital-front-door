export type TenantWebsiteService = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  enabled?: boolean;
};

export type TenantProjectGalleryItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  enabled?: boolean;
};

export type TenantWebsiteSettings = {
  template?: "ai_trust_v1";
  primaryColor?: string;
  accentColor?: string;

  logoUrl?: string;
  heroImageUrl?: string;
  whyUsImageUrl?: string;
  aboutImageUrl?: string;

  showWhyUs?: boolean;
  showServices?: boolean;
  showBanner?: boolean;
  showServiceAreas?: boolean;
  showAbout?: boolean;
  showReviews?: boolean;
  showFaqs?: boolean;

  showProjectGallery?: boolean;
  projectGalleryHeading?: string;
  projectGalleryTitle?: string;
  projectGalleryDescription?: string;
  projectGallery?: TenantProjectGalleryItem[];

  facebookUrl?: string;
  instagramUrl?: string;
  yelpUrl?: string;
  googleBusinessUrl?: string;

  heroHeadline?: string;
  heroDescription?: string;
  heroPrimaryCtaLabel?: string;
  heroSecondaryCtaLabel?: string;

  whyUsHeading?: string;
  whyUsTitle?: string;
  whyUsBullet1Title?: string;
  whyUsBullet1Text?: string;
  whyUsBullet2Title?: string;
  whyUsBullet2Text?: string;
  whyUsBullet3Title?: string;
  whyUsBullet3Text?: string;

  aboutHeading?: string;
  aboutTitle?: string;
  aboutBody?: string;
  aboutCtaLabel?: string;

  bannerHeading?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerButtonLabel?: string;

  serviceAreasHeading?: string;
  serviceAreasTitle?: string;

  reviewsHeading?: string;
  reviewsTitle?: string;

  faqsHeading?: string;
  faqsTitle?: string;
  faqsDescription?: string;
  faqsButtonLabel?: string;
  faqs?: {
    id: string;
    question: string;
    answer: string;
    enabled?: boolean;
  }[];

  servicesSectionHeading?: string;
  servicesSectionTitle?: string;
  servicesSectionDescription?: string;
  services?: TenantWebsiteService[];
};

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
  addressLine2?: string | null;
  country?: string | null;
  serviceRadiusMiles?: number | null;

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
  excludedServiceCities?: string[];
  outOfAreaMessage?: string;
  isInsured?: boolean;
  shareBusinessAddressInChat?: boolean; 

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

  bookingType?: string | null;
  nextStepMessage?: string | null;

  // ===============================
  // Existing / UI Support Fields
  // ===============================
  primaryColor?: string;

  //===============================
  // Web Settings
  //===============================
  websiteSettings?: TenantWebsiteSettings;
};