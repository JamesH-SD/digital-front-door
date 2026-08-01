export type CampaignStatus = "draft" | "active" | "ended";

export type TenantCampaign = {
  id: string;
  tenantSlug: string;
  name: string;
  description?: string | null;
  greetingMessage?: string | null;
  status: CampaignStatus;
  qrSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignSourceCount = {
  source: string;
  count: number;
};

export type CampaignWithCounts = TenantCampaign & {
  knowledgeItemCount: number;
  imageCount: number;
  documentCount: number;

  leadCount: number;
  bookedAppointmentCount: number;
  bookingRate: number;
  sourceCounts: CampaignSourceCount[];
};