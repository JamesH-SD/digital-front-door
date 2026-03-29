import fs from "fs/promises";
import path from "path";
import { Lead } from "@/lib/types/lead";

const filePath = path.join(process.cwd(), "data", "leads.json");

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readLeads(): Promise<Lead[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeLeads(leads: Lead[]) {
  await fs.writeFile(filePath, JSON.stringify(leads, null, 2));
}

export async function createLead(
  input: Omit<Lead, "id" | "createdAt" | "status">
) {
  const leads = await readLeads();

  const newLead: Lead = {
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

  leads.unshift(newLead);

  console.log("Writing to:", filePath);

  await writeLeads(leads);

  console.log("[FILE STORAGE] Lead saved:", newLead);

  return newLead;
}

export async function getLeadsByTenantSlug(tenantSlug: string) {
  const leads = await readLeads();

  return leads.filter((lead) => lead.tenantSlug === tenantSlug);
}