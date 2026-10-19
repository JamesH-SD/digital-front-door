/**
 * F2 hosted website truthfulness + hours (no HTTP). Run: npx tsx scripts/verify-website-presentation-f2.ts
 */
import type { Tenant } from "../lib/types/tenant";
import { getPublicBusinessHoursRows } from "../lib/website/formatBusinessHours";
import { getPublicFaqs } from "../lib/website/getPublicFaqs";
import { getPublicTrustLabels } from "../lib/website/getPublicTrustLabels";
import {
  getPublicWebsiteServices,
  tenantHasPublicServiceAreaContent,
} from "../lib/website/getPublicWebsiteServices";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function tenant(partial: Partial<Tenant> & Pick<Tenant, "businessName">): Tenant {
  return {
    id: "t1",
    slug: "test",
    ...partial,
  };
}

const hours = {
  monday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "09:00", close: "12:00", closed: false },
  sunday: { open: "09:00", close: "12:00", closed: true },
};

const hoursRows = getPublicBusinessHoursRows(hours);
assert(hoursRows.length >= 2, "hours rows from canonical structure");
assert(
  hoursRows.some((row) => row.hoursText === "Closed"),
  "closed days render as Closed"
);

assert(getPublicBusinessHoursRows({}).length === 0, "no hours → empty rows");

const trust = getPublicTrustLabels(
  tenant({
    businessName: "Hughes",
    licenseNumber: "CSLB #999999",
    isInsured: true,
  })
);
assert(trust.length === 2, "trust only from tenant facts");
assert(!trust.some((label) => label.includes("info available")), "no filler trust");

const noTrust = getPublicTrustLabels(
  tenant({ businessName: "Plain Co" })
);
assert(noTrust.length === 0, "no trust without license/insured");

const genericFaqs = getPublicFaqs(
  tenant({ businessName: "Empty", websiteSettings: {} })
);
assert(
  !genericFaqs.some((faq) => faq.question.includes("get started")),
  "no generic AI FAQ fallback"
);

const derivedFaqs = getPublicFaqs(
  tenant({
    businessName: "Area Co",
    serviceAreaSummary: "San Diego County",
  })
);
assert(
  derivedFaqs.some((faq) => faq.question === "What areas do you serve?"),
  "safe derived service area FAQ"
);

const authoredFaqs = getPublicFaqs(
  tenant({
    businessName: "Custom",
    websiteSettings: {
      faqs: [
        {
          id: "1",
          question: "Custom Q?",
          answer: "Custom A.",
        },
      ],
    },
  })
);
assert(authoredFaqs[0]?.question === "Custom Q?", "tenant-authored FAQs preserved");

assert(
  getPublicWebsiteServices(
    tenant({ businessName: "No Svc", websiteSettings: {}, servicesOffered: [] })
  ).length === 0,
  "no fake default service cards"
);

assert(
  tenantHasPublicServiceAreaContent(
    tenant({ businessName: "X", serviceCities: ["Carlsbad"] })
  ),
  "service area detection"
);

console.log("verify-website-presentation-f2: OK");
