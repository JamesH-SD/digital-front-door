import { NextRequest, NextResponse } from "next/server";
import {
  createTenantKnowledgeItem,
  getTenantKnowledgeItems,
} from "@/lib/db/tenant-knowledge";
import type { TenantKnowledgeSourceType } from "@/lib/types/tenant-knowledge";

import { createRequire } from "module";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);

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

async function extractTextFromUpload(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  const mimeType = file.type;

  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
      dataBuffer: Buffer
    ) => Promise<{ text?: string }>;
  
    const result = await pdfParse(buffer);
  
    return result.text || "";
  }

  return "";
}

function truncateKnowledgeContent(value: string, maxLength = 12000) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}\n\n[Content truncated for AI context.]`;
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
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const { createAdminClient } = await import("@/lib/supabase/admin");

    const supabase = createAdminClient();
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 }
      );
    }

    const title = String(formData.get("title") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const sourceTypeRaw = formData.get("sourceType");
    const tagsRaw = String(formData.get("tags") || "");
    const knowledgeScopeRaw = String(formData.get("knowledgeScope") || "global");
    const campaignIdRaw = String(formData.get("campaignId") || "").trim();

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Title and summary are required." },
        { status: 400 }
      );
    }

    const sourceType = isValidSourceType(sourceTypeRaw)
      ? sourceTypeRaw
      : "document";

    const knowledgeScope =
      knowledgeScopeRaw === "campaign" ? "campaign" : "global";

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${tenantSlug}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-knowledge")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Knowledge upload error:", uploadError.message);

      return NextResponse.json(
        { error: "Failed to upload file." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("tenant-knowledge")
      .getPublicUrl(path);

    const tags = tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

      let extractedText = "";

      try {
        extractedText = await extractTextFromUpload(file);
      } catch (error) {
        console.error("Failed to extract uploaded file text:", error);
      }

      const content = [
        summary,
        notes ? `Additional notes: ${notes}` : null,
        extractedText
          ? `Extracted file text:\n${truncateKnowledgeContent(extractedText)}`
          : "No readable text could be extracted from this file. Use the summary, notes, title, and tags for AI context.",
        `Uploaded file: ${file.name}`,
      ]
        .filter(Boolean)
        .join("\n\n");

    const { data, error } = await supabase
      .from("tenant_knowledge_items")
      .insert({
        tenant_slug: tenantSlug,
        source_type: sourceType,
        title,
        content,
        summary,
        tags,
        confidence: "medium",
        source_label: "Tenant Upload",
        knowledge_scope: knowledgeScope,
        campaign_id: knowledgeScope === "campaign" ? campaignIdRaw || null : null,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Knowledge record insert error:", error.message);

      return NextResponse.json(
        { error: "File uploaded, but failed to create knowledge record." },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data }, { status: 201 });
  }

  // Existing manual JSON behavior stays below.
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const body = await request.json();

  const id = typeof body.id === "string" ? body.id : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!id || !title || !content) {
    return NextResponse.json(
      { error: "ID, title, and content are required." },
      { status: 400 }
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_knowledge_items")
    .update({
      title,
      content,
      source_type: isValidSourceType(body.sourceType)
        ? body.sourceType
        : "manual_note",
      tags: Array.isArray(body.tags) ? body.tags : [],
      confidence:
        body.confidence === "low" ||
        body.confidence === "medium" ||
        body.confidence === "high"
          ? body.confidence
          : "medium",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_slug", tenantSlug)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update knowledge item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Knowledge item ID is required." },
      { status: 400 }
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: existingItem, error: fetchError } = await supabase
    .from("tenant_knowledge_items")
    .select("id, file_url")
    .eq("id", id)
    .eq("tenant_slug", tenantSlug)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: "Knowledge item not found." },
      { status: 404 }
    );
  }

  if (existingItem?.file_url) {
    const marker = "/tenant-knowledge/";
    const fileUrl = String(existingItem.file_url);
    const path = fileUrl.includes(marker)
      ? decodeURIComponent(fileUrl.split(marker)[1])
      : "";

    if (path) {
      await supabase.storage.from("tenant-knowledge").remove([path]);
    }
  }

  const { error: deleteError } = await supabase
    .from("tenant_knowledge_items")
    .delete()
    .eq("id", id)
    .eq("tenant_slug", tenantSlug);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete knowledge item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}