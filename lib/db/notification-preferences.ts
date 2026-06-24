import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationPreferences = {
  leadEmailAlerts: boolean;
  appointmentEmailAlerts: boolean;
  billingEmailAlerts: boolean;
  weeklySummaryEnabled: boolean;
  aiEscalationAlerts: boolean;
};

export async function getNotificationPreferences({
  tenantSlug,
  userId,
}: {
  tenantSlug: string;
  userId: string;
}): Promise<NotificationPreferences> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("tenant_notification_preferences")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return {
      leadEmailAlerts: true,
      appointmentEmailAlerts: true,
      billingEmailAlerts: true,
      weeklySummaryEnabled: false,
      aiEscalationAlerts: true,
    };
  }

  return {
    leadEmailAlerts: data.lead_email_alerts,
    appointmentEmailAlerts: data.appointment_email_alerts,
    billingEmailAlerts: data.billing_email_alerts,
    weeklySummaryEnabled: data.weekly_summary_enabled,
    aiEscalationAlerts: data.ai_escalation_alerts,
  };
}