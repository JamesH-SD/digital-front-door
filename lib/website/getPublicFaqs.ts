import type { PublicTenant } from "@/lib/website/publicTenant";

export type PublicFaq = {
  question: string;
  answer: string;
};

/**
 * Tenant-authored website FAQs plus a small set of fact-safe derived FAQs.
 */
export function getPublicFaqs(tenant: PublicTenant): PublicFaq[] {
  const websiteFaqs = tenant.websiteSettings?.faqs || [];

  const authored = websiteFaqs
    .filter(
      (faq) =>
        faq.enabled !== false &&
        faq.question?.trim() &&
        faq.answer?.trim()
    )
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }));

  if (authored.length > 0) {
    return authored;
  }

  const derived: PublicFaq[] = [];

  const cities = (tenant.serviceCities || []).filter((city) => city.trim());
  if (tenant.serviceAreaSummary?.trim() || cities.length > 0) {
    const areaText =
      tenant.serviceAreaSummary?.trim() ||
      `We serve ${cities.join(", ")}.`;

    derived.push({
      question: "What areas do you serve?",
      answer: areaText,
    });
  }

  if (tenant.licenseNumber?.trim()) {
    derived.push({
      question: "Are you licensed?",
      answer: `Yes. License ${tenant.licenseNumber.trim()}.`,
    });
  }

  if (tenant.isInsured) {
    derived.push({
      question: "Are you insured?",
      answer: "Yes, we are insured.",
    });
  }

  return derived;
}
