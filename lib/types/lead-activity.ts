export type LeadActivityType =
  | "lead.created"
  | "lead.viewed"
  | "lead.status_changed"
  | "lead.customer_update_added"
  | "lead.email_added"
  | "lead.email_updated"
  | "lead.address_updated"
  | "lead.location_updated"
  | "lead.timeline_updated"
  | "lead.appointment_updated"
  | "lead.image_uploaded";

export type LeadActivitySource = "system" | "customer" | "admin";

export type LeadActivityMetadata = {
  message?: string;
  fieldName?: string;
  previousValue?: string | null;
  newValue?: string | null;
  imageId?: string;
  imageUrl?: string;
  filename?: string;
  [key: string]: any;
};

export type LeadActivity = {
  id: string;
  leadId: string;
  tenantSlug: string;
  eventType: LeadActivityType;
  eventSource: LeadActivitySource;
  actorLabel?: string | null;
  metadata?: LeadActivityMetadata | null;
  createdAt: string;
};