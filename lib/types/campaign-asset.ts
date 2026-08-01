export type CampaignAssetSource =
  | "business_card"
  | "vehicle"
  | "yard_sign"
  | "flyer"
  | "door_hanger"
  | "facebook"
  | "instagram"
  | "google_business"
  | "referral"
  | "website"
  | "custom";

export type CampaignAsset = {
  id: string;
  campaignId: string;
  tenantSlug: string;
  name: string;
  source: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};