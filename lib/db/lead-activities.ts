import { createClient } from "@/lib/supabase/server";
import type {
  LeadActivity,
  LeadActivityMetadata,
  LeadActivitySource,
  LeadActivityType,
} from "@/lib/types/lead-activity";

function mapLeadActivity(row: any): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    tenantSlug: row.tenant_slug,
    eventType: row.event_type,
    eventSource: row.event_source,
    actorLabel: row.actor_label ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.created_at,
  };
}

export async function createLeadActivity(input: {
  leadId: string;
  tenantSlug: string;
  eventType: LeadActivityType;
  eventSource: LeadActivitySource;
  actorLabel?: string | null;
  metadata?: LeadActivityMetadata | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_activities")
    .insert({
      lead_id: input.leadId,
      tenant_slug: input.tenantSlug,
      event_type: input.eventType,
      event_source: input.eventSource,
      actor_label: input.actorLabel ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating lead activity:", error.message);
    throw error;
  }

  return mapLeadActivity(data);
}

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lead activities:", error.message);
    return [];
  }

  return data.map(mapLeadActivity);
}