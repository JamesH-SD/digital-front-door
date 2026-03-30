import { createClient } from "@/lib/supabase/server";
import { Lead } from "@/lib/types/lead";

/**
 * Get all leads for a tenant
 */
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

  return data.map(mapLead);
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(
  tenantSlug: string,
  leadId: string
): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead:", error.message);
    return null;
  }

  return data ? mapLead(data) : null;
}

/**
 * Create a new lead
 */
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
  status?: string;
}) {
  const supabase = await createClient();

  // 1. get tenant code
  const { data: tenant } = await supabase
    .from("tenants")
    .select("tenant_code")
    .eq("slug", input.tenantSlug)
    .single();

  if (!tenant?.tenant_code) {
    throw new Error("Missing tenant code");
  }

  // 2. generate lead number
  const { data: leadNumberData } = await supabase.rpc(
    "generate_lead_number",
    { p_tenant_code: tenant.tenant_code }
  );

  const leadNumber = leadNumberData;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      tenant_id: input.tenantId ?? null,
      tenant_slug: input.tenantSlug,
      lead_number: leadNumber, // 👈 NEW
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
      status: input.status ?? "new",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating lead:", error.message);
    throw error;
  }

  return mapLead(data);
}

/**
 * Update an existing lead
 */
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
    status: string;
    images: {
      id: string;
      url: string;
      filename?: string;
    }[];
  }>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      phone: updates.phone,
      email: updates.email,
      address: updates.address,
      project_type: updates.projectType,
      location: updates.location,
      timeline: updates.timeline,
      appointment: updates.appointment,
      notes: updates.notes,
      status: updates.status,
      images: updates.images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("Error updating lead:", error.message);
    throw error;
  }

  return mapLead(data);
}

/**
 * Map DB → app model
 */
function mapLead(data: any): Lead {
  return {
    id: data.id,
    leadNumber: data.lead_number ?? "",
    tenantId: data.tenant_id ?? "",
    tenantSlug: data.tenant_slug ?? "",
    sessionId: data.session_id ?? undefined,
    customerName: data.customer_name ?? "",
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    address: data.address ?? undefined,
    projectType: data.project_type ?? "",
    location: data.location ?? "",
    timeline: data.timeline ?? "",
    appointment: data.appointment ?? undefined,
    notes: data.notes ?? undefined,
    images: data.images ?? [],
    status: data.status ?? "new",
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}