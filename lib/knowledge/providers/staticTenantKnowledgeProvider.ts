import type {
    RetrieveTenantKnowledgeInput,
    RetrieveTenantKnowledgeResult,
    TenantKnowledgeItem,
  } from "@/lib/types/tenant-knowledge";
  
  const STATIC_KNOWLEDGE: TenantKnowledgeItem[] = [
    {
      id: "hughes-general-license-insurance",
      tenantSlug: "hughes-general",
      sourceType: "policy",
      title: "License and Insurance",
      content:
        "Hughes General is licensed under CSLB #999999 and is insured.",
      tags: ["license", "insured", "insurance", "cslb"],
      confidence: "high",
      sourceLabel: "Tenant profile",
    },
    {
      id: "hughes-general-service-area",
      tenantSlug: "hughes-general",
      sourceType: "service",
      title: "Service Area",
      content:
        "Hughes General serves San Diego County, including San Marcos, Carlsbad, Vista, Oceanside, Escondido, and surrounding nearby areas.",
      tags: ["service area", "san diego", "san marcos", "carlsbad", "vista"],
      confidence: "high",
      sourceLabel: "Tenant profile",
    },
    {
      id: "hughes-general-samples",
      tenantSlug: "hughes-general",
      sourceType: "faq",
      title: "Samples for Remodel Projects",
      content:
        "For remodel projects, customers can ask whether samples are available. The team can follow up about cabinet, flooring, tile, window, or finish samples when relevant. Do not promise a specific sample unless it is confirmed.",
      tags: ["samples", "cabinets", "flooring", "tile", "finishes"],
      confidence: "medium",
      sourceLabel: "Manual knowledge",
    },
  ];
  
  function scoreKnowledgeItem(item: TenantKnowledgeItem, query: string) {
    const normalizedQuery = query.toLowerCase();
    const searchable = [
      item.title,
      item.content,
      ...(item.tags || []),
    ]
      .join(" ")
      .toLowerCase();
  
    let score = 0;
  
    for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
      if (searchable.includes(token)) {
        score += 1;
      }
    }
  
    return score;
  }
  
  export async function retrieveStaticTenantKnowledge(
    input: RetrieveTenantKnowledgeInput
  ): Promise<RetrieveTenantKnowledgeResult> {
    const limit = input.limit ?? 5;
  
    const items = STATIC_KNOWLEDGE
      .filter((item) => item.tenantSlug === input.tenantSlug)
      .map((item) => ({
        item,
        score: scoreKnowledgeItem(item, input.query),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((result) => result.item)
      .slice(0, limit);
  
    return { items };
  }