export type ReadinessItemStatus = "complete" | "needs_attention";

export type ReadinessCategoryStatus =
  | "complete"
  | "needs_attention"
  | "not_applicable";

export type ReadinessItemTier = "required" | "recommended";

export type ReadinessCategoryKey =
  | "business_profile"
  | "ai_receptionist"
  | "knowledge_base"
  | "calendar"
  | "website";

export type ReadinessItem = {
  id: string;
  label: string;
  status: ReadinessItemStatus;
  tier: ReadinessItemTier;
  adminHref?: string;
};

export type ReadinessCategoryResult = {
  key: ReadinessCategoryKey;
  label: string;
  status: ReadinessCategoryStatus;
  applicable: boolean;
  /** When false, category may still display guidance but is excluded from overallPercent. */
  contributesToOverall: boolean;
  percent: number;
  items: ReadinessItem[];
  adminHref?: string;
};

export type TenantSetupReadiness = {
  overallPercent: number;
  categories: ReadinessCategoryResult[];
};

export type TenantSetupReadinessInput = {
  tenant: {
    slug: string;
    businessName?: string | null;
    primaryPhone?: string | null;
    email?: string | null;
    websiteUrl?: string | null;
    deploymentMode?: "existing_site" | "hosted" | null;
    serviceAreaSummary?: string | null;
    servicesOffered?: string[] | null;
    tagline?: string | null;
    aboutUs?: string | null;
    licenseNumber?: string | null;
    isInsured?: boolean | null;
    addressLine1?: string | null;
    serviceCities?: string[] | null;
    hours?: Record<string, unknown> | null;
    bookingType?: string | null;
    greetingMessage?: string | null;
    nextStepMessage?: string | null;
    websiteStatus?: "draft" | "published" | null;
    websiteSettings?: {
      services?: Array<{ title?: string }> | null;
    } | null;
  };
  globalKnowledgeItemCount: number;
  hasActivePrimaryCalendar: boolean;
};
