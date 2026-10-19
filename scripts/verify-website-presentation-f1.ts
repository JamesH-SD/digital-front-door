/**
 * F1 website content/branding precedence (no HTTP). Run: npx tsx scripts/verify-website-presentation-f1.ts
 */
import type { Tenant } from "../lib/types/tenant";
import {
  resolveWebsiteAboutBody,
  resolveWebsiteBrandColors,
  resolveWebsiteHeroDescription,
  resolveWebsiteHeroHeadline,
  websiteAboutUsesTenantAbout,
  websiteHeroUsesTenantTagline,
} from "../lib/website/resolveTenantWebsitePresentation";
import {
  F1_SERVICES_SECTION_HEADING,
  F1_SERVICES_SECTION_TITLE,
  LEGACY_SERVICES_SECTION_DESCRIPTION,
  LEGACY_SERVICES_SECTION_HEADING,
  clearLegacyServicesSectionFields,
  isDerivedServicesSectionDescription,
  resolveWebsiteServicesSection,
} from "../lib/website/resolveWebsiteServicesSection";

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

const withTagline = tenant({
  businessName: "Pauls Painting",
  tagline: "Quality finishes for San Diego homes",
  aboutUs: "We paint interiors and exteriors.",
  websiteSettings: {},
});

assert(
  resolveWebsiteHeroHeadline(withTagline) === "Quality finishes for San Diego homes",
  "hero headline should use tenant tagline when no website override"
);
assert(websiteHeroUsesTenantTagline(withTagline), "tagline precedence flag");

const heroOverride = tenant({
  businessName: "Pauls Painting",
  tagline: "Ignored tagline",
  websiteSettings: { heroHeadline: "Custom hero" },
});

assert(
  resolveWebsiteHeroHeadline(heroOverride) === "Custom hero",
  "website hero override wins"
);
assert(!websiteHeroUsesTenantTagline(heroOverride), "override blocks tagline flag");

assert(
  resolveWebsiteHeroDescription(withTagline) === "We paint interiors and exteriors.",
  "hero description falls back to aboutUs when no heroDescription"
);

assert(
  resolveWebsiteAboutBody(withTagline) === "We paint interiors and exteriors.",
  "about uses tenant aboutUs"
);
assert(websiteAboutUsesTenantAbout(withTagline), "about precedence flag");

const colors = resolveWebsiteBrandColors(
  tenant({
    businessName: "Test",
    primaryColor: "#112233",
    websiteSettings: { accentColor: "#AABBCC" },
  })
);

assert(colors.primary === "#112233", "tenant primaryColor used");
assert(colors.accent === "#AABBCC", "website accentColor used");
assert(colors.accentButtonText === "#111827" || colors.accentButtonText === "#ffffff", "contrast text");

const hughesLike = tenant({
  businessName: "Hughes General Contractors",
  slug: "hughes-general",
  servicesOffered: ["General construction, framing, plumbing"],
  websiteSettings: {
    servicesSectionHeading: LEGACY_SERVICES_SECTION_HEADING,
    servicesSectionTitle: LEGACY_SERVICES_SECTION_DESCRIPTION,
    servicesSectionDescription: "General construction, framing, plumbing",
  },
});

const hughesServices = resolveWebsiteServicesSection(hughesLike);
assert(
  hughesServices.heading === F1_SERVICES_SECTION_HEADING,
  "Hughes-like legacy heading normalizes to Our Services"
);
assert(
  hughesServices.title === F1_SERVICES_SECTION_TITLE,
  "Hughes-like misaligned title normalizes to Services We Offer"
);
assert(hughesServices.description === "", "derived services list is not section description");

assert(
  isDerivedServicesSectionDescription(
    "General construction, framing, plumbing",
    hughesLike.servicesOffered
  ),
  "derived description detection"
);

const customServices = tenant({
  businessName: "Custom Co",
  websiteSettings: {
    servicesSectionHeading: "What We Do",
    servicesSectionTitle: "Residential Painting",
    servicesSectionDescription: "Interior and exterior finishes since 1998.",
  },
  servicesOffered: ["Interior painting"],
});

const customResolved = resolveWebsiteServicesSection(customServices);
assert(customResolved.heading === "What We Do", "custom services heading preserved");
assert(customResolved.title === "Residential Painting", "custom services title preserved");
assert(
  customResolved.description === "Interior and exterior finishes since 1998.",
  "custom services description preserved"
);

const cleared = clearLegacyServicesSectionFields(
  hughesLike.websiteSettings!,
  hughesLike.servicesOffered
);
assert(cleared.servicesSectionHeading === "", "admin clears legacy heading");
assert(cleared.servicesSectionTitle === "", "admin clears legacy title");
assert(cleared.servicesSectionDescription === "", "admin clears derived description");

console.log("verify-website-presentation-f1: OK");
