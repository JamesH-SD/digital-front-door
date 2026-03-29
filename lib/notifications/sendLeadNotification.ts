import { Lead } from "@/lib/types/lead";

export async function sendLeadNotification(lead: Lead) {
  // Simulate SMS
  console.log("📲 SMS Notification:");
  console.log(`New lead for ${lead.tenantSlug}`);
  console.log(`${lead.customerName} - ${lead.contact}`);
  console.log(`${lead.projectType} in ${lead.location}`);
  console.log("------");

  // Simulate Email
  console.log("📧 Email Notification:");
  console.log({
    subject: `New Lead - ${lead.projectType}`,
    body: `
      Name: ${lead.customerName}
      Contact: ${lead.contact}
      Project: ${lead.projectType}
      Location: ${lead.location}
      Timeline: ${lead.timeline}
    `,
  });

  return true;
}