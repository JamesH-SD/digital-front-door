import { createAdminClient } from "@/lib/supabase/admin";
import type { CampaignAsset } from "@/lib/types/campaign-asset";

function mapCampaignAssetRow(row: any): CampaignAsset {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    tenantSlug: row.tenant_slug,
    name: row.name,
    source: row.source,
    slug: row.slug,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

function createAssetSlug(name: string) {
  const readablePart = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return `${readablePart || "asset"}-${suffix}`;
}

export async function getCampaignAssets(input: {
  tenantSlug: string;
  campaignId?: string;
}): Promise<CampaignAsset[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("campaign_assets")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (input.campaignId) {
    query = query.eq("campaign_id", input.campaignId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading campaign assets:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCampaignAssetRow);
}

export async function getCampaignAssetById(input: {
  tenantSlug: string;
  campaignAssetId: string;
}): Promise<CampaignAsset | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("campaign_assets")
    .select("*")
    .eq("id", input.campaignAssetId)
    .eq("tenant_slug", input.tenantSlug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error loading campaign asset:", error.message);
    return null;
  }

  return data ? mapCampaignAssetRow(data) : null;
}

export async function getCampaignAssetBySlug(input: {
  tenantSlug: string;
  campaignId: string;
  assetSlug: string;
}): Promise<CampaignAsset | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("campaign_assets")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .eq("campaign_id", input.campaignId)
    .eq("slug", input.assetSlug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error loading campaign asset by slug:", error.message);
    return null;
  }

  return data ? mapCampaignAssetRow(data) : null;
}

export async function createCampaignAsset(input: {
  tenantSlug: string;
  campaignId: string;
  name: string;
  source: string;
}): Promise<CampaignAsset> {
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("tenant_campaigns")
    .select("id")
    .eq("id", input.campaignId)
    .eq("tenant_slug", input.tenantSlug)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const { data, error } = await supabase
    .from("campaign_assets")
    .insert({
      tenant_slug: input.tenantSlug,
      campaign_id: input.campaignId,
      name: input.name.trim(),
      source: input.source.trim().toLowerCase(),
      slug: createAssetSlug(input.name),
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating campaign asset:", error.message);
    throw new Error(error.message);
  }

  return mapCampaignAssetRow(data);
}

export async function updateCampaignAsset(input: {
  tenantSlug: string;
  campaignAssetId: string;
  name?: string;
  source?: string;
  isActive?: boolean;
}): Promise<CampaignAsset> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.name === "string") {
    updates.name = input.name.trim();
  }

  if (typeof input.source === "string") {
    updates.source = input.source.trim().toLowerCase();
  }

  if (typeof input.isActive === "boolean") {
    updates.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("campaign_assets")
    .update(updates)
    .eq("id", input.campaignAssetId)
    .eq("tenant_slug", input.tenantSlug)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating campaign asset:", error.message);
    throw new Error(error.message);
  }

  return mapCampaignAssetRow(data);
}

export async function deleteCampaignAsset(input: {
  tenantSlug: string;
  campaignAssetId: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("campaign_assets")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.campaignAssetId)
    .eq("tenant_slug", input.tenantSlug)
    .is("deleted_at", null);

  if (error) {
    console.error("Error deleting campaign asset:", error.message);
    throw new Error(error.message);
  }
}