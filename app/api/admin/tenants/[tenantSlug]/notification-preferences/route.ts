import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

type RouteParams = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { tenantSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserTenantMembership({
    userId: user.id,
    tenantSlug,
  });

  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tenant_notification_preferences")
    .upsert(
      {
        tenant_slug: tenantSlug,
        user_id: user.id,
        lead_email_alerts: Boolean(body.leadEmailAlerts),
        appointment_email_alerts: Boolean(body.appointmentEmailAlerts),
        billing_email_alerts: Boolean(body.billingEmailAlerts),
        weekly_summary_enabled: Boolean(body.weeklySummaryEnabled),
        ai_escalation_alerts: Boolean(body.aiEscalationAlerts),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tenant_slug,user_id",
      }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}