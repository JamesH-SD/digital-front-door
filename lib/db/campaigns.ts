import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CampaignStatus,
  CampaignWithCounts,
  TenantCampaign,
} from "@/lib/types/campaign";

function mapCampaignRow(row: any): TenantCampaign {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    name: row.name,
    description: row.description ?? null,
    greetingMessage: row.greeting_message ?? null,
    status: row.status as CampaignStatus,
    qrSlug: row.qr_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createQrSlug(name: string) {
  const readablePart = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return `${readablePart || "campaign"}-${suffix}`;
}

export async function getTenantCampaigns(
  tenantSlug: string
): Promise<CampaignWithCounts[]> {
  const supabase = createAdminClient();

  const { data: campaigns, error } = await supabase
    .from("tenant_campaigns")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading tenant campaigns:", error.message);
    return [];
  }

  const campaignRows = campaigns ?? [];

  if (campaignRows.length === 0) {
    return [];
  }

  const campaignIds = campaignRows.map((campaign) => campaign.id);

  const { data: knowledgeItems, error: knowledgeError } = await supabase
    .from("tenant_knowledge_items")
    .select("campaign_id, source_type, mime_type")
    .eq("tenant_slug", tenantSlug)
    .in("campaign_id", campaignIds);

  if (knowledgeError) {
    console.error(
      "Error loading campaign knowledge counts:",
      knowledgeError.message
    );
  }

  const counts = new Map<
    string,
    {
      knowledgeItemCount: number;
      imageCount: number;
      documentCount: number;
    }
  >();

  for (const item of knowledgeItems ?? []) {
    if (!item.campaign_id) continue;

    const current = counts.get(item.campaign_id) ?? {
      knowledgeItemCount: 0,
      imageCount: 0,
      documentCount: 0,
    };

    current.knowledgeItemCount += 1;

    const mimeType = String(item.mime_type || "");
    const sourceType = String(item.source_type || "");

    if (mimeType.startsWith("image/") || sourceType === "photo") {
      current.imageCount += 1;
    } else if (
      sourceType === "document" ||
      mimeType === "application/pdf" ||
      mimeType.includes("word")
    ) {
      current.documentCount += 1;
    }

    counts.set(item.campaign_id, current);
  }

  return campaignRows.map((row) => {
    const campaign = mapCampaignRow(row);
    const campaignCounts = counts.get(campaign.id) ?? {
      knowledgeItemCount: 0,
      imageCount: 0,
      documentCount: 0,
    };

    return {
      ...campaign,
      ...campaignCounts,
    };
  });
}

export async function getCampaignById(input: {
  tenantSlug: string;
  campaignId: string;
}): Promise<TenantCampaign | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .select("*")
    .eq("id", input.campaignId)
    .eq("tenant_slug", input.tenantSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error loading campaign:", error.message);
    return null;
  }

  return data ? mapCampaignRow(data) : null;
}

export async function getCampaignByQrSlug(input: {
  tenantSlug: string;
  qrSlug: string;
}): Promise<TenantCampaign | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .eq("qr_slug", input.qrSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error loading campaign by QR slug:", error.message);
    return null;
  }

  return data ? mapCampaignRow(data) : null;
}

export async function createTenantCampaign(input: {
  tenantSlug: string;
  name: string;
  description?: string;
  greetingMessage?: string;
}): Promise<TenantCampaign> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .insert({
      tenant_slug: input.tenantSlug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      greeting_message: input.greetingMessage?.trim() || null,
      status: "draft",
      qr_slug: createQrSlug(input.name),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating campaign:", error.message);
    throw error;
  }

  return mapCampaignRow(data);
}

export async function updateTenantCampaign(input: {
  tenantSlug: string;
  campaignId: string;
  name?: string;
  description?: string | null;
  greetingMessage?: string | null;
  status?: CampaignStatus;
}): Promise<TenantCampaign> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.name === "string") {
    updates.name = input.name.trim();
  }

  if (typeof input.description !== "undefined") {
    updates.description = input.description?.trim() || null;
  }

  if (typeof input.greetingMessage !== "undefined") {
    updates.greeting_message = input.greetingMessage?.trim() || null;
  }

  if (typeof input.status !== "undefined") {
    updates.status = input.status;
  }

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .update(updates)
    .eq("id", input.campaignId)
    .eq("tenant_slug", input.tenantSlug)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating campaign:", error.message);
    throw error;
  }

  return mapCampaignRow(data);
}

export async function deleteTenantCampaign(input: {
  tenantSlug: string;
  campaignId: string;
}) {
  const supabase = createAdminClient();

  const { data: items, error: itemsError } = await supabase
    .from("tenant_knowledge_items")
    .select("id, file_url")
    .eq("tenant_slug", input.tenantSlug)
    .eq("campaign_id", input.campaignId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const storagePaths = (items ?? [])
    .map((item) => {
      const fileUrl = String(item.file_url || "");
      const marker = "/tenant-knowledge/";

      if (!fileUrl.includes(marker)) return null;

      return decodeURIComponent(fileUrl.split(marker)[1]);
    })
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("tenant-knowledge")
      .remove(storagePaths);

    if (storageError) {
      console.error(
        "Non-fatal campaign storage deletion error:",
        storageError.message
      );
    }
  }

  const { error: itemDeleteError } = await supabase
    .from("tenant_knowledge_items")
    .delete()
    .eq("tenant_slug", input.tenantSlug)
    .eq("campaign_id", input.campaignId);

  if (itemDeleteError) {
    throw new Error(itemDeleteError.message);
  }

  const { error: campaignDeleteError } = await supabase
    .from("tenant_campaigns")
    .delete()
    .eq("id", input.campaignId)
    .eq("tenant_slug", input.tenantSlug);

  if (campaignDeleteError) {
    throw new Error(campaignDeleteError.message);
  }
}