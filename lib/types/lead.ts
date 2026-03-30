export type LeadStatus = "new" | "contacted" | "booked" | "closed";

export type LeadImage = {
  id: string;
  url: string;
  filename?: string;
};

export type Lead = {
  id: string;
  leadNumber?: string;
  tenantId: string;
  tenantSlug: string;
  sessionId?: string;
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  projectType: string;
  location: string;
  timeline: string;
  appointment?: string;
  notes?: string;
  images?: LeadImage[];
  status: LeadStatus;
  createdAt: string;
};