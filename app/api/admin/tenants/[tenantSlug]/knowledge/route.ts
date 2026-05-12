import { NextRequest, NextResponse } from "next/server";
import {
  createTenantKnowledgeItem,
  getTenantKnowledgeItems,
} from "@/lib/db/tenant-knowledge";
import type { TenantKnowledgeSourceType } from "@/lib/types/tenant-knowledge";

const VALID_SOURCE_TYPES: TenantKnowledgeSourceType[] = [
  "manual_note",
  "faq",
  "document",
  "photo",
  "website",
  "service",
  "policy",
  "pricing",
  "unknown",
];

function isValidSourceType(value: unknown): value is TenantKnowledgeSourceType {
  return typeof value === "string" && VALID_SOURCE_TYPES.includes(value as TenantKnowledgeSourceType);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;

  const items = await getTenantKnowledgeItems(tenantSlug);

  return NextResponse.json({
    items,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required." },
      { status: 400 }
    );
  }

  const item = await createTenantKnowledgeItem({
    tenantSlug,
    sourceType: isValidSourceType(body.sourceType)
      ? body.sourceType
      : "manual_note",
    title,
    content,
    tags: Array.isArray(body.tags) ? body.tags : [],
    confidence:
      body.confidence === "low" ||
      body.confidence === "medium" ||
      body.confidence === "high"
        ? body.confidence
        : "medium",
    sourceLabel:
      typeof body.sourceLabel === "string" ? body.sourceLabel : "Manual Entry",
  });

  return NextResponse.json({ item }, { status: 201 });
}