export type TenantBusinessType =
  | "contractor"
  | "real_estate"
  | "salon"
  | "consultant"
  | "legal"
  | "medical"
  | "auto_service"
  | "other";

  export type TenantConversionGoal =
  | "book_appointment"
  | "request_quote"
  | "collect_lead"
  | "schedule_call"
  | "manual_follow_up"
  | "product_signup";

  export type TenantSuccessfulOutcome =
  | "lead_captured"
  | "appointment_booked"
  | "account_signup";

export type TenantRequiredField = {
  id:
    | "name"
    | "phone"
    | "email"
    | "location"
    | "project_type"
    | "timeline"
    | "budget"
    | "preferred_service"
    | "preferred_date"
    | "preferred_time";

  label: string;
  required: boolean;
  phase: "pre_lead" | "post_lead" | "pre_booking" | "optional";
  promptHint: string;
};

export type TenantInteractionType = {
  id:
    | "site_visit"
    | "phone_call"
    | "video_call"
    | "consultation"
    | "showing"
    | "inspection"
    | "appointment"
    | "manual_follow_up";

  label: string;
  description: string;
  enabled: boolean;
  requiresAddress: boolean;
  intentHints: string[];
  customerFacingLabel: string;
};

export type TenantConfig = {
  tenantSlug: string;
  businessType: TenantBusinessType;
  conversionGoal: TenantConversionGoal;
  successfulOutcomes: TenantSuccessfulOutcome[];
  requiredFields: TenantRequiredField[];
  interactionTypes: TenantInteractionType[];

  scheduling: {
    enabled: boolean;
    provider: "google" | "manual" | "none";
    defaultTimezone: string;
    slotMinutes: number;
    lookaheadDays: number;
    maxDaysToReturn: number;
  };

  knowledgeSources: {
    docsEnabled: boolean;
    photosEnabled: boolean;
    faqEnabled: boolean;
    retrievalMode: "tenant_scoped";
  };
};

export type LegacyAppointmentType = "call" | "site_visit";

export type TenantInteractionTypeId = TenantInteractionType["id"];

export function mapInteractionTypeToAppointmentType(
  interactionType?: TenantInteractionType["id"] | null
): LegacyAppointmentType | null {
  if (interactionType === "site_visit") return "site_visit";
  if (interactionType === "phone_call") return "call";

  return null;
}