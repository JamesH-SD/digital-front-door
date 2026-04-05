import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadImage, LeadStatus } from "@/lib/types/lead";

function mapLead(row: any): Lead {
  return {
    id: row.id,
    leadNumber: row.lead_number ?? "",
    tenantId: row.tenant_id ?? "",
    tenantSlug: row.tenant_slug ?? "",
    sessionId: row.session_id ?? undefined,
    customerName: row.customer_name ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    projectType: row.project_type ?? "",
    location: row.location ?? "",
    timeline: row.timeline ?? "",
    appointment: row.appointment ?? undefined,
    notes: row.notes ?? undefined,
    customerUpdates: row.customer_updates ?? undefined,
    images: row.images ?? [],
    status: row.status ?? "new",
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function getLeadsByTenantSlug(
  tenantSlug: string
): Promise<Lead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error.message);
    return [];
  }

  return (data ?? []).map(mapLead);
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead:", error.message);
    return null;
  }

  return data ? mapLead(data) : null;
}

export async function createLead(input: {
  tenantId?: string;
  tenantSlug: string;
  sessionId?: string;
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  projectType?: string;
  location?: string;
  timeline?: string;
  appointment?: string;
  notes?: string;
  customerUpdates?: string;
  images?: LeadImage[];
  status?: LeadStatus;
}): Promise<Lead> {
  const supabase = await createClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("tenant_code")
    .eq("slug", input.tenantSlug)
    .single();

  if (tenantError) {
    console.error("Error fetching tenant code:", tenantError.message);
    throw tenantError;
  }

  if (!tenant?.tenant_code) {
    throw new Error("Missing tenant code");
  }

  const { data: leadNumberData, error: leadNumberError } = await supabase.rpc(
    "generate_lead_number",
    { p_tenant_code: tenant.tenant_code }
  );

  if (leadNumberError) {
    console.error("Error generating lead number:", leadNumberError.message);
    throw leadNumberError;
  }

  const leadNumber = leadNumberData;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      tenant_id: input.tenantId ?? null,
      tenant_slug: input.tenantSlug,
      lead_number: leadNumber,
      session_id: input.sessionId ?? null,
      customer_name: input.customerName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      project_type: input.projectType ?? null,
      location: input.location ?? null,
      timeline: input.timeline ?? null,
      appointment: input.appointment ?? null,
      notes: input.notes ?? null,
      customer_updates: input.customerUpdates ?? null,
      images: input.images ?? [],
      status: input.status ?? "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating lead:", error.message);
    throw error;
  }

  return mapLead(data);
}

export async function updateLead(
  leadId: string,
  updates: Partial<{
    phone: string;
    email: string;
    address: string;
    projectType: string;
    location: string;
    timeline: string;
    appointment: string;
    notes: string;
    customerUpdates: string;
    status: LeadStatus;
    images: LeadImage[];
  }>
): Promise<Lead> {
  const supabase = await createClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.phone !== "undefined") payload.phone = updates.phone;
  if (typeof updates.email !== "undefined") payload.email = updates.email;
  if (typeof updates.address !== "undefined") payload.address = updates.address;
  if (typeof updates.projectType !== "undefined") {
    payload.project_type = updates.projectType;
  }
  if (typeof updates.location !== "undefined") payload.location = updates.location;
  if (typeof updates.timeline !== "undefined") payload.timeline = updates.timeline;
  if (typeof updates.appointment !== "undefined") {
    payload.appointment = updates.appointment;
  }
  if (typeof updates.notes !== "undefined") payload.notes = updates.notes;
  if (typeof updates.customerUpdates !== "undefined") {
    payload.customer_updates = updates.customerUpdates;
  }
  if (typeof updates.status !== "undefined") payload.status = updates.status;
  if (typeof updates.images !== "undefined") payload.images = updates.images;

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating lead:", error.message);
    throw error;
  }

  return mapLead(data);
}