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

  const { data: campaigns, error: campaignError } = await supabase
    .from("tenant_campaigns")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (campaignError) {
    console.error(
      "Error loading tenant campaigns:",
      campaignError.message
    );

    return [];
  }

  const campaignRows = campaigns ?? [];

  if (campaignRows.length === 0) {
    return [];
  }

  const campaignIds = campaignRows.map((campaign) => campaign.id);

  /*
   * Load campaign content and campaign leads at the same time.
   */
  const [
    { data: knowledgeItems, error: knowledgeError },
    { data: campaignLeads, error: leadsError },
  ] = await Promise.all([
    supabase
      .from("tenant_knowledge_items")
      .select("campaign_id, source_type, mime_type")
      .eq("tenant_slug", tenantSlug)
      .in("campaign_id", campaignIds),

    supabase
      .from("leads")
      .select("id, campaign_id, lead_source, status")
      .eq("tenant_slug", tenantSlug)
      .in("campaign_id", campaignIds),
  ]);

  if (knowledgeError) {
    console.error(
      "Error loading campaign knowledge counts:",
      knowledgeError.message
    );
  }

  if (leadsError) {
    console.error(
      "Error loading campaign lead analytics:",
      leadsError.message
    );
  }

  const leadRows = campaignLeads ?? [];
  const leadIds = leadRows.map((lead) => lead.id);

  /*
   * Appointments are linked to leads rather than directly to campaigns.
   * Only query them when campaign leads exist.
   */
  let appointmentRows: Array<{
    lead_id: string;
    status: string;
  }> = [];

  if (leadIds.length > 0) {
    const { data: appointments, error: appointmentError } = await supabase
      .from("appointments")
      .select("lead_id, status")
      .in("lead_id", leadIds);

    if (appointmentError) {
      console.error(
        "Error loading campaign appointment analytics:",
        appointmentError.message
      );
    } else {
      appointmentRows = appointments ?? [];
    }
  }

  /*
   * Existing campaign-content counts.
   */
  const contentCounts = new Map<
    string,
    {
      knowledgeItemCount: number;
      imageCount: number;
      documentCount: number;
    }
  >();

  for (const item of knowledgeItems ?? []) {
    if (!item.campaign_id) continue;

    const current = contentCounts.get(item.campaign_id) ?? {
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

    contentCounts.set(item.campaign_id, current);
  }

  /*
   * Create a lookup from lead ID to campaign ID.
   */
  const campaignIdByLeadId = new Map<string, string>();

  for (const lead of leadRows) {
    if (!lead.id || !lead.campaign_id) continue;

    campaignIdByLeadId.set(lead.id, lead.campaign_id);
  }

  /*
   * Track unique leads that have a confirmed appointment.
   *
   * Using a Set prevents one lead with multiple appointment records from
   * being counted more than once.
   */
  const bookedLeadIdsByCampaign = new Map<string, Set<string>>();

  for (const appointment of appointmentRows) {
    if (appointment.status !== "confirmed") {
      continue;
    }

    const campaignId = campaignIdByLeadId.get(appointment.lead_id);

    if (!campaignId) {
      continue;
    }

    const current =
      bookedLeadIdsByCampaign.get(campaignId) ?? new Set<string>();

    current.add(appointment.lead_id);
    bookedLeadIdsByCampaign.set(campaignId, current);
  }

  /*
   * Track lead totals and source breakdowns.
   */
  const leadCountsByCampaign = new Map<string, number>();

  const sourceCountsByCampaign = new Map<
    string,
    Map<string, number>
  >();

  for (const lead of leadRows) {
    if (!lead.campaign_id) continue;

    leadCountsByCampaign.set(
      lead.campaign_id,
      (leadCountsByCampaign.get(lead.campaign_id) ?? 0) + 1
    );

    const source =
      typeof lead.lead_source === "string" &&
      lead.lead_source.trim()
        ? lead.lead_source.trim()
        : "unknown";

    const campaignSources =
      sourceCountsByCampaign.get(lead.campaign_id) ??
      new Map<string, number>();

    campaignSources.set(
      source,
      (campaignSources.get(source) ?? 0) + 1
    );

    sourceCountsByCampaign.set(
      lead.campaign_id,
      campaignSources
    );
  }

  return campaignRows.map((row) => {
    const campaign = mapCampaignRow(row);

    const campaignContentCounts =
      contentCounts.get(campaign.id) ?? {
        knowledgeItemCount: 0,
        imageCount: 0,
        documentCount: 0,
      };

    const leadCount =
      leadCountsByCampaign.get(campaign.id) ?? 0;

    const bookedAppointmentCount =
      bookedLeadIdsByCampaign.get(campaign.id)?.size ?? 0;

    const bookingRate =
      leadCount > 0
        ? Number(
            (
              (bookedAppointmentCount / leadCount) *
              100
            ).toFixed(1)
          )
        : 0;

    const sourceCounts = Array.from(
      sourceCountsByCampaign.get(campaign.id)?.entries() ?? []
    )
      .map(([source, count]) => ({
        source,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      ...campaign,
      ...campaignContentCounts,
      leadCount,
      bookedAppointmentCount,
      bookingRate,
      sourceCounts,
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