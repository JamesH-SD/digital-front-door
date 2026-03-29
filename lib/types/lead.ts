export type LeadStatus = "new" | "contacted" | "closed";

export type Lead = {
  id: string;
  tenantId: string;
  tenantSlug: string;
  customerName: string;
  contact: string;
  projectType: string;
  location: string;
  timeline: string;
  status: LeadStatus;
  createdAt: string;
};