import { evaluateAiReceptionist } from "@/lib/readiness/evaluateAiReceptionist";
import { evaluateBusinessProfile } from "@/lib/readiness/evaluateBusinessProfile";
import { evaluateCalendar } from "@/lib/readiness/evaluateCalendar";
import { evaluateHostedWebsite } from "@/lib/readiness/evaluateHostedWebsite";
import { evaluateKnowledgeBase } from "@/lib/readiness/evaluateKnowledgeBase";
import { computeOverallPercent } from "@/lib/readiness/computeCategoryResult";
import type { Tenant } from "@/lib/types/tenant";
import type {
  TenantSetupReadiness,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function buildTenantSetupReadinessInput(input: {
  tenant: Tenant;
  globalKnowledgeItemCount: number;
  hasActivePrimaryCalendar: boolean;
}): TenantSetupReadinessInput {
  const { tenant } = input;
  return {
    tenant: {
      slug: tenant.slug,
      businessName: tenant.businessName,
      primaryPhone: tenant.primaryPhone,
      email: tenant.email,
      websiteUrl: tenant.websiteUrl,
      deploymentMode: tenant.deploymentMode ?? null,
      serviceAreaSummary: tenant.serviceAreaSummary,
      servicesOffered: tenant.servicesOffered,
      tagline: tenant.tagline,
      aboutUs: tenant.aboutUs,
      licenseNumber: tenant.licenseNumber,
      isInsured: tenant.isInsured,
      addressLine1: tenant.addressLine1,
      serviceCities: tenant.serviceCities,
      hours: tenant.hours,
      bookingType: tenant.bookingType,
      greetingMessage: tenant.greetingMessage,
      nextStepMessage: tenant.nextStepMessage,
      websiteStatus: tenant.websiteStatus,
      websiteSettings: tenant.websiteSettings,
    },
    globalKnowledgeItemCount: input.globalKnowledgeItemCount,
    hasActivePrimaryCalendar: input.hasActivePrimaryCalendar,
  };
}

export function getTenantSetupReadinessFromInput(
  input: TenantSetupReadinessInput
): TenantSetupReadiness {
  const categories = [
    evaluateBusinessProfile(input),
    evaluateAiReceptionist(input),
    evaluateKnowledgeBase(input),
    evaluateCalendar(input),
    evaluateHostedWebsite(input),
  ];

  return {
    overallPercent: computeOverallPercent(categories),
    categories,
  };
}

export function getTenantSetupReadiness(input: {
  tenant: Tenant;
  globalKnowledgeItemCount: number;
  hasActivePrimaryCalendar: boolean;
}): TenantSetupReadiness {
  return getTenantSetupReadinessFromInput(
    buildTenantSetupReadinessInput(input)
  );
}
