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
  leadSource?: string | null;
  campaignId?: string | null;
  campaignAssetId?: string | null;
  campaignName?: string | null;
  notes?: string;
  customerUpdates?: string;
  images: LeadImage[];
  status: LeadStatus;
  createdAt: string;
  updatedAt?: string;
  aiSummary?: string | null;
  aiMissingInfo?: string[] | null;
  aiNextStep?: string | null;
  aiSuggestedReply?: string | null;
  aiCopilotUpdatedAt?: string | null;
};