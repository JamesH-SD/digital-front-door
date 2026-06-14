import type { Tenant } from "@/lib/types/tenant";
import type { TenantConfig } from "@/lib/types/tenant-config";

export function getTenantConfig(tenant: Tenant): TenantConfig {
  const isContactorTenant = tenant.slug === "contactor";

  if (isContactorTenant) {
    return {
      tenantSlug: tenant.slug,
      businessType: "other",
      conversionGoal: "product_signup",
      successfulOutcomes: ["lead_captured", "account_signup"],

      requiredFields: [
        {
          id: "preferred_service",
          label: "Business need",
          required: true,
          phase: "pre_lead",
          promptHint:
            "Ask what they want help with, such as a website, AI receptionist, lead capture, or getting started.",
        },
        {
          id: "location",
          label: "Business location",
          required: false,
          phase: "pre_lead",
          promptHint: "Ask where the business is located only if useful.",
        },
        {
          id: "name",
          label: "Customer name",
          required: false,
          phase: "pre_lead",
          promptHint: "Ask for their name only if they want help or follow-up.",
        },
        {
          id: "email",
          label: "Email",
          required: false,
          phase: "pre_lead",
          promptHint: "Ask for email only if they want help getting started.",
        },
        {
          id: "phone",
          label: "Phone number",
          required: false,
          phase: "optional",
          promptHint: "Do not require phone. Ask only if they request follow-up.",
        },
      ],

      interactionTypes: [
        {
          id: "manual_follow_up",
          label: "Follow-up",
          customerFacingLabel: "getting help getting started",
          description: "A lightweight follow-up request without calendar booking.",
          enabled: true,
          requiresAddress: false,
          intentHints: ["help me get started", "follow up", "contact me"],
        },
      ],

      scheduling: {
        enabled: false,
        provider: "none",
        defaultTimezone: "America/Los_Angeles",
        slotMinutes: 60,
        lookaheadDays: 14,
        maxDaysToReturn: 7,
      },

      knowledgeSources: {
        docsEnabled: true,
        photosEnabled: true,
        faqEnabled: true,
        retrievalMode: "tenant_scoped",
      },
    };
  }

  return {
    tenantSlug: tenant.slug,

    businessType: "contractor",

    conversionGoal: "request_quote",

    successfulOutcomes: ["lead_captured", "appointment_booked"],

    requiredFields: [
      {
        id: "project_type",
        label: "Project type",
        required: true,
        phase: "pre_lead",
        promptHint: "Ask what kind of project they need help with.",
      },
      {
        id: "location",
        label: "Project location",
        required: true,
        phase: "pre_lead",
        promptHint: "Ask what city or area the project is in.",
      },
      {
        id: "timeline",
        label: "Timeline",
        required: tenant.askForTimeline !== false,
        phase: "pre_lead",
        promptHint: "Ask when they are hoping to start or complete the work.",
      },
      {
        id: "name",
        label: "Customer name",
        required: true,
        phase: "pre_lead",
        promptHint: "Ask for their name naturally.",
      },
      {
        id: "phone",
        label: "Phone number",
        required: tenant.requirePhoneForLead !== false,
        phase: "pre_lead",
        promptHint: "Ask for the best phone number to reach them.",
      },
      {
        id: "email",
        label: "Email",
        required: false,
        phase: "pre_booking",
        promptHint: "Ask for email only when useful for appointment details.",
      },
    ],

    interactionTypes: [
      {
        id: "site_visit",
        label: "On-site visit",
        customerFacingLabel: "having someone come take a look",
        description: "Someone visits the project location to review scope.",
        enabled: true,
        requiresAddress: true,
        intentHints: [
          "come out",
          "come by",
          "come to my house",
          "look at the space",
          "see the project",
          "estimate visit",
          "inspect",
        ],
      },
      {
        id: "phone_call",
        label: "Phone call",
        customerFacingLabel: "a quick call",
        description: "A phone conversation to discuss the request.",
        enabled: true,
        requiresAddress: false,
        intentHints: ["call", "phone", "talk", "discuss by phone"],
      },
    ],

    scheduling: {
      enabled: true,
      provider: "google",
      defaultTimezone: "America/Los_Angeles",
      slotMinutes: 60,
      lookaheadDays: 14,
      maxDaysToReturn: 7,
    },

    knowledgeSources: {
      docsEnabled: true,
      photosEnabled: true,
      faqEnabled: true,
      retrievalMode: "tenant_scoped",
    },
  };
}