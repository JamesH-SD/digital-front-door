import { Lead } from "@/lib/types/lead";

type LeadStore = Map<string, Lead[]>;

declare global {
  // eslint-disable-next-line no-var
  var __leadStore__: LeadStore | undefined;
}

const leads: LeadStore = globalThis.__leadStore__ ?? new Map();

if (!globalThis.__leadStore__) {
  globalThis.__leadStore__ = leads;
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createLead(
  input: Omit<Lead, "id" | "createdAt" | "status">
) {
  const lead: Lead = {
    id: generateId("lead"),
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    customerName: input.customerName,
    contact: input.contact,
    projectType: input.projectType,
    location: input.location,
    timeline: input.timeline,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const existing = leads.get(input.tenantSlug) ?? [];
  existing.unshift(lead);
  leads.set(input.tenantSlug, existing);

  console.log("[createLead] stored lead:", lead);
  console.log("[createLead] tenant lead count:", input.tenantSlug, existing.length);

  return lead;
}

export async function getLeadsByTenantSlug(tenantSlug: string) {
  const tenantLeads = leads.get(tenantSlug) ?? [];

  console.log("[getLeadsByTenantSlug] tenantSlug:", tenantSlug);
  console.log("[getLeadsByTenantSlug] count:", tenantLeads.length);

  return tenantLeads;
}