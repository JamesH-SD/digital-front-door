type AppointmentSource = "chat" | "office";

type AppointmentType = "call" | "site_visit";

export type AppointmentLead = {
  leadNumber?: string | null;
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  projectType?: string | null;
  location?: string | null;
  timeline?: string | null;
  notes?: string | null;
  customerUpdates?: string | null;
  leadSource?: string | null;
  campaignName?: string | null;
};

type BuildAppointmentDescriptionInput = {
  source: AppointmentSource;
  lead?: AppointmentLead | null;
  appointmentType?: AppointmentType;
  address?: string | null;
  summary?: string | null;
};

function toTitleCase(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bCa\b/g, "CA")
    .replace(/\bUsa\b/g, "USA");
}

function formatPhoneForCalendar(value?: string | null) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(
      7
    )}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6
    )}`;
  }

  return value;
}

function formatAddressForDisplay(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bCa\b/g, "CA")
    .replace(/\bUsa\b/g, "USA");
}

function formatLeadSource(input: {
  leadSource?: string | null;
  campaignName?: string | null;
}) {
  if (input.campaignName?.trim()) {
    return "Campaign";
  }

  if (input.leadSource?.trim()) {
    return toTitleCase(input.leadSource.replace(/_/g, " "));
  }

  return "Website";
}

export function buildAppointmentDescription({
  source,
  lead,
  appointmentType,
  address,
  summary,
}: BuildAppointmentDescriptionInput) {
  return [
    `Scheduled From: ${source === "chat" ? "Chat" : "Office"}`,

    "",

    `Lead Source: ${formatLeadSource({
      leadSource: lead?.leadSource,
      campaignName: lead?.campaignName,
    })}`,

    lead?.campaignName?.trim()
      ? `Campaign: ${lead.campaignName.trim()}`
      : null,

    "",

    lead?.leadNumber ? `Lead: ${lead.leadNumber}` : null,

    lead?.customerName
      ? `Customer: ${toTitleCase(lead.customerName)}`
      : null,

    lead?.phone
      ? `Phone: ${formatPhoneForCalendar(lead.phone)}`
      : null,

    lead?.email ? `Email: ${lead.email}` : null,

    lead?.projectType
      ? `Project: ${toTitleCase(lead.projectType)}`
      : null,

    lead?.location
      ? `Location: ${toTitleCase(lead.location)}`
      : null,

    lead?.timeline
      ? `Timeline: ${toTitleCase(lead.timeline)}`
      : null,

    appointmentType
      ? `Appointment Type: ${
          appointmentType === "site_visit"
            ? "On-site Visit"
            : "Phone Call"
        }`
      : null,

    address?.trim()
      ? `Address: ${formatAddressForDisplay(address)}`
      : null,

    summary?.trim() ? `Summary: ${summary.trim()}` : null,

    lead?.customerUpdates?.trim()
      ? `Customer Updates: ${lead.customerUpdates.trim()}`
      : null,

    lead?.notes?.trim() ? `Notes: ${lead.notes.trim()}` : null,
  ]
    .filter((value): value is string => value !== null)
    .join("\n");
}