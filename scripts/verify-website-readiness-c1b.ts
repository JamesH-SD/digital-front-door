/**
 * C1b Website admin readiness checks. Run: node node_modules/tsx/dist/cli.mjs scripts/verify-website-readiness-c1b.ts
 */
import { getHostedWebsiteOperationalReadiness } from "../lib/readiness/getHostedWebsiteOperationalReadiness";
import {
  getWebsiteBuilderProgress,
  getWebsiteBuilderProgressPercent,
} from "../lib/website/getWebsiteBuilderProgress";
import type { Tenant } from "../lib/types/tenant";

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    slug: "demo",
    businessName: "Demo",
    primaryPhone: "555-0100",
    email: "a@b.co",
    deploymentMode: "hosted",
    websiteStatus: "published",
    servicesOffered: ["Plumbing"],
    websiteSettings: {},
    ...overrides,
  } as Tenant;
}

function assert(name: string, condition: boolean, detail?: string) {
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`ok: ${name}`);
}

// 1. Hosted + published + services + phone — operational complete, builder may be <100%
{
  const t = tenant({ websiteSettings: {} });
  const op = getHostedWebsiteOperationalReadiness(t);
  const polish = getWebsiteBuilderProgressPercent(t);
  assert(
    "hosted published operational Ready",
    op.applicable && op.status === "complete"
  );
  assert("builder polish under 100%", polish.percent < 100);
}

// 2. Hosted draft
{
  const t = tenant({ websiteStatus: "draft" });
  const op = getHostedWebsiteOperationalReadiness(t);
  const missing = op.items.filter((i) => i.status === "needs_attention");
  assert("draft needs attention", op.status === "needs_attention");
  assert(
    "publication identified",
    missing.some((i) => i.id === "website_published")
  );
}

// 3. Missing services
{
  const t = tenant({
    servicesOffered: [],
    websiteSettings: { services: [] },
  });
  const op = getHostedWebsiteOperationalReadiness(t);
  assert("missing services", op.status === "needs_attention");
}

// 4. Missing phone
{
  const t = tenant({ primaryPhone: "" });
  const op = getHostedWebsiteOperationalReadiness(t);
  assert("missing phone", op.status === "needs_attention");
}

// 5. Existing-site N/A
{
  const t = tenant({ deploymentMode: "existing_site", websiteUrl: "https://x.com" });
  const op = getHostedWebsiteOperationalReadiness(t);
  assert("existing-site N/A", !op.applicable && op.status === "not_applicable");
  assert(
    "builder checklist still works",
    getWebsiteBuilderProgress(t).length === 8
  );
}

// 6. Builder checklist equivalence (minimal published hosted fixture)
{
  const t = tenant({
    websiteSettings: {
      logoUrl: "https://logo",
      faviconUrl: "https://icon",
      heroHeadline: "Hi",
      whyUsTitle: "Why",
      services: [{ id: "1", title: "S" }],
      aboutBody: "About",
      faqs: [{ id: "1", question: "Q", answer: "A" }],
    },
  });
  const { completedCount, percent } = getWebsiteBuilderProgressPercent(t);
  assert("8-item checklist", getWebsiteBuilderProgress(t).length === 8);
  assert("all polish complete", completedCount === 8 && percent === 100);
}

console.log("\nAll C1b website verification checks passed.");
