import type {
  ReadinessCategoryKey,
  ReadinessCategoryResult,
  ReadinessCategoryStatus,
  ReadinessItem,
} from "@/lib/readiness/types";

function scoreFromItems(items: ReadinessItem[]): {
  percent: number;
  status: ReadinessCategoryStatus;
} {
  if (items.length === 0) {
    return { percent: 100, status: "complete" };
  }

  const completeCount = items.filter((item) => item.status === "complete").length;
  const percent = Math.round((completeCount / items.length) * 100);
  const status: ReadinessCategoryStatus = items.every(
    (item) => item.status === "complete"
  )
    ? "complete"
    : "needs_attention";

  return { percent, status };
}

export function computeCategoryResult(input: {
  key: ReadinessCategoryKey;
  label: string;
  applicable: boolean;
  items: ReadinessItem[];
  adminHref?: string;
  contributesToOverall?: boolean;
}): ReadinessCategoryResult {
  if (!input.applicable) {
    return {
      key: input.key,
      label: input.label,
      status: "not_applicable",
      applicable: false,
      contributesToOverall: false,
      percent: 0,
      items: [],
      adminHref: input.adminHref,
    };
  }

  const contributesToOverall = input.contributesToOverall ?? true;
  const requiredItems = input.items.filter((item) => item.tier === "required");

  // Operational status/percent: required items only when any exist.
  // Recommended-only categories (e.g. Knowledge) score from their display items.
  const operationalItems =
    requiredItems.length > 0 ? requiredItems : input.items;
  const { percent, status } = scoreFromItems(operationalItems);

  return {
    key: input.key,
    label: input.label,
    status,
    applicable: true,
    contributesToOverall,
    percent,
    items: input.items,
    adminHref: input.adminHref,
  };
}

export function computeOverallPercent(
  categories: ReadinessCategoryResult[]
): number {
  const contributing = categories.filter(
    (category) => category.applicable && category.contributesToOverall
  );

  if (contributing.length === 0) {
    return 0;
  }

  const sum = contributing.reduce(
    (total, category) => total + category.percent,
    0
  );

  return Math.round(sum / contributing.length);
}
