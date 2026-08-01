export const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  hosted_website: "Hosted Website",
  existing_website: "Existing Website",

  google: "Google",
  google_business: "Google Business",

  facebook: "Facebook",
  instagram: "Instagram",

  business_card: "Business Card",
  yard_sign: "Yard Sign",
  vehicle: "Vehicle",
  flyer: "Flyer",
  door_hanger: "Door Hanger",

  custom: "Custom",
  campaign: "Campaign",
  referral: "Referral",
  direct: "Direct",

  truck: "Truck",
  truck_wrap: "Truck Wrap",
  qr: "QR Code",

  unknown: "Unknown",
};
  
  export function formatLeadSource(source?: string | null): string {
    if (!source) return "Unknown";
  
    return (
      SOURCE_LABELS[source] ??
      source
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }