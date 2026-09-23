/**
 * Manual scenario checks for lib/readiness (C1a). Run: node node_modules/tsx/dist/cli.mjs scripts/verify-tenant-setup-readiness.ts
 */
import { getTenantSetupReadinessFromInput } from "../lib/readiness/getTenantSetupReadiness";
import type { TenantSetupReadinessInput } from "../lib/readiness/types";

function baseTenant(
  overrides: Partial<TenantSetupReadinessInput["tenant"]> = {}
): TenantSetupReadinessInput["tenant"] {
  return {
    slug: "demo",
    businessName: "Demo Co",
    primaryPhone: "555-0100",
    email: "hello@demo.co",
    serviceAreaSummary: "Metro area",
    servicesOffered: ["Plumbing"],
    deploymentMode: "hosted",
    websiteUrl: null,
    bookingType: "consultation",
    websiteStatus: "published",
    websiteSettings: { services: [{ title: "Plumbing" }] },
    ...overrides,
  };
}

function run(
  name: string,
  input: TenantSetupReadinessInput,
  expect: {
    overall?: number;
    category?: Partial<
      Record<
        string,
        {
          status: string;
          applicable: boolean;
          percent?: number;
          contributesToOverall?: boolean;
        }
      >
    >;
  }
) {
  const result = getTenantSetupReadinessFromInput(input);
  const lines: string[] = [`\n=== ${name} ===`, `overall: ${result.overallPercent}%`];

  for (const cat of result.categories) {
    const req = cat.items.filter((i) => i.tier === "required");
    const reqComplete = req.filter((i) => i.status === "complete").length;
    lines.push(
      `  ${cat.key}: ${cat.status} applicable=${cat.applicable} contributes=${cat.contributesToOverall} ${cat.percent}% (required ${reqComplete}/${req.length}, items ${cat.items.length})`
    );
    const exp = expect.category?.[cat.key];
    if (exp) {
      if (exp.status && cat.status !== exp.status) {
        throw new Error(
          `${name}: ${cat.key} status expected ${exp.status}, got ${cat.status}`
        );
      }
      if (exp.applicable !== undefined && cat.applicable !== exp.applicable) {
        throw new Error(
          `${name}: ${cat.key} applicable expected ${exp.applicable}, got ${cat.applicable}`
        );
      }
      if (
        exp.contributesToOverall !== undefined &&
        cat.contributesToOverall !== exp.contributesToOverall
      ) {
        throw new Error(
          `${name}: ${cat.key} contributesToOverall expected ${exp.contributesToOverall}, got ${cat.contributesToOverall}`
        );
      }
      if (exp.percent !== undefined && cat.percent !== exp.percent) {
        throw new Error(
          `${name}: ${cat.key} percent expected ${exp.percent}, got ${cat.percent}`
        );
      }
    }
  }

  if (expect.overall !== undefined && result.overallPercent !== expect.overall) {
    throw new Error(
      `${name}: overall expected ${expect.overall}, got ${result.overallPercent}`
    );
  }

  console.log(lines.join("\n"));
}

const scenarios: Array<() => void> = [
  () =>
    run(
      "new/incomplete tenant",
      {
        tenant: { slug: "new" },
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 0,
        category: {
          business_profile: {
            status: "needs_attention",
            applicable: true,
            contributesToOverall: true,
          },
          ai_receptionist: {
            status: "needs_attention",
            applicable: true,
            contributesToOverall: true,
          },
          knowledge_base: {
            status: "needs_attention",
            applicable: true,
            contributesToOverall: false,
            percent: 0,
          },
          calendar: { status: "not_applicable", applicable: false },
          website: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "100% operational — all required complete, recommended polish missing",
      {
        tenant: baseTenant({
          tagline: null,
          aboutUs: null,
          hours: null,
          greetingMessage: null,
          nextStepMessage: null,
        }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: true,
      },
      {
        overall: 100,
        category: {
          business_profile: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: true,
          },
          ai_receptionist: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: true,
          },
          knowledge_base: {
            status: "needs_attention",
            applicable: true,
            percent: 0,
            contributesToOverall: false,
          },
          calendar: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: true,
          },
          website: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: true,
          },
        },
      }
    ),
  () =>
    run(
      "hosted + published (consultation + calendar), with knowledge",
      {
        tenant: baseTenant(),
        globalKnowledgeItemCount: 2,
        hasActivePrimaryCalendar: true,
      },
      {
        overall: 100,
        category: {
          knowledge_base: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: false,
          },
        },
      }
    ),
  () =>
    run(
      "hosted + draft tenant",
      {
        tenant: baseTenant({ websiteStatus: "draft" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: true,
      },
      {
        overall: 92,
        category: {
          website: { status: "needs_attention", applicable: true, percent: 67 },
        },
      }
    ),
  () =>
    run(
      "existing-site tenant (required complete)",
      {
        tenant: baseTenant({
          deploymentMode: "existing_site",
          websiteUrl: "https://example.com",
          websiteStatus: "draft",
        }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: true,
      },
      {
        overall: 100,
        category: {
          website: { status: "not_applicable", applicable: false },
          calendar: { status: "complete", applicable: true, percent: 100 },
        },
      }
    ),
  () =>
    run(
      "null bookingType — calendar N/A",
      {
        tenant: baseTenant({ bookingType: null }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        category: {
          ai_receptionist: { status: "needs_attention", applicable: true },
          calendar: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "legacy reservation — calendar N/A",
      {
        tenant: baseTenant({ bookingType: "reservation" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: true,
      },
      {
        category: {
          ai_receptionist: { status: "needs_attention", applicable: true },
          calendar: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "consultation without calendar",
      {
        tenant: baseTenant({ bookingType: "consultation" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 75,
        category: {
          calendar: { status: "needs_attention", applicable: true, percent: 0 },
        },
      }
    ),
  () =>
    run(
      "phone_call requires calendar",
      {
        tenant: baseTenant({ bookingType: "phone_call" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        category: {
          calendar: { status: "needs_attention", applicable: true, percent: 0 },
        },
      }
    ),
  () =>
    run(
      "estimate — calendar N/A",
      {
        tenant: baseTenant({ bookingType: "estimate" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 100,
        category: {
          calendar: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "lead_capture — calendar N/A",
      {
        tenant: baseTenant({ bookingType: "lead_capture" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 100,
        category: {
          calendar: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "product_signup — calendar N/A",
      {
        tenant: baseTenant({ bookingType: "product_signup" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 100,
        category: {
          calendar: { status: "not_applicable", applicable: false },
        },
      }
    ),
  () =>
    run(
      "no knowledge — overall unchanged",
      {
        tenant: baseTenant({ bookingType: "lead_capture" }),
        globalKnowledgeItemCount: 0,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 100,
        category: {
          knowledge_base: {
            status: "needs_attention",
            applicable: true,
            percent: 0,
            contributesToOverall: false,
          },
        },
      }
    ),
  () =>
    run(
      "global knowledge present",
      {
        tenant: baseTenant({ bookingType: "lead_capture" }),
        globalKnowledgeItemCount: 3,
        hasActivePrimaryCalendar: false,
      },
      {
        overall: 100,
        category: {
          knowledge_base: {
            status: "complete",
            applicable: true,
            percent: 100,
            contributesToOverall: false,
          },
        },
      }
    ),
];

for (const scenario of scenarios) {
  scenario();
}

console.log("\nAll readiness scenario checks passed.");
