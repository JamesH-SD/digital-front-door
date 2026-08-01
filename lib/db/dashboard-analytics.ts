import { createAdminClient } from "@/lib/supabase/admin";

export type DashboardSourceCount = {
  source: string;
  leadCount: number;
  bookedCount: number;
  bookingRate: number;
};

export type DashboardCampaignSummary = {
  id: string;
  name: string;
  status: string;
  leadCount: number;
  bookedCount: number;
  bookingRate: number;
};

export type DashboardAnalytics = {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  bookedLeads: number;
  closedLeads: number;
  bookingRate: number;

  sourceCounts: DashboardSourceCount[];
  topSource: DashboardSourceCount | null;

  campaignCount: number;
  activeCampaignCount: number;
  campaignLeadCount: number;
  campaignBookedCount: number;
  campaignBookingRate: number;
  campaignSummaries: DashboardCampaignSummary[];
  topCampaign: DashboardCampaignSummary | null;
};

function normalizeSource(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "unknown";
  }

  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export async function getDashboardAnalytics(
  tenantSlug: string
): Promise<DashboardAnalytics> {
  const supabase = createAdminClient();

  const [
    { data: leadRows, error: leadsError },
    { data: campaignRows, error: campaignsError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, status, lead_source, campaign_id, campaign_name, created_at"
      )
      .eq("tenant_slug", tenantSlug),

    supabase
      .from("tenant_campaigns")
      .select("id, name, status")
      .eq("tenant_slug", tenantSlug),
  ]);

  if (leadsError) {
    console.error(
      "Error loading dashboard leads:",
      leadsError.message
    );
  }

  if (campaignsError) {
    console.error(
      "Error loading dashboard campaigns:",
      campaignsError.message
    );
  }

  const leads = leadRows ?? [];
  const campaigns = campaignRows ?? [];
  const leadIds = leads
    .map((lead) => lead.id)
    .filter((id): id is string => Boolean(id));

  let appointmentRows: Array<{
    lead_id: string;
    status: string;
  }> = [];

  if (leadIds.length > 0) {
    const { data, error } = await supabase
      .from("appointments")
      .select("lead_id, status")
      .in("lead_id", leadIds);

    if (error) {
      console.error(
        "Error loading dashboard appointments:",
        error.message
      );
    } else {
      appointmentRows = data ?? [];
    }
  }

  /*
   * Count each confirmed lead only once, even if it has multiple
   * appointment records.
   */
  const confirmedLeadIds = new Set<string>();

  for (const appointment of appointmentRows) {
    if (
      appointment.status === "confirmed" &&
      appointment.lead_id
    ) {
      confirmedLeadIds.add(appointment.lead_id);
    }
  }

  const totalLeads = leads.length;
  const newLeads = leads.filter(
    (lead) => lead.status === "new"
  ).length;
  const contactedLeads = leads.filter(
    (lead) => lead.status === "contacted"
  ).length;
  const closedLeads = leads.filter(
    (lead) => lead.status === "closed"
  ).length;

  /*
   * Prefer confirmed appointment records for booked counts.
   * The lead status remains a fallback for older records that may not
   * have an appointment row.
   */
  const bookedLeadIds = new Set<string>(confirmedLeadIds);

  for (const lead of leads) {
    if (lead.status === "booked" && lead.id) {
      bookedLeadIds.add(lead.id);
    }
  }

  const bookedLeads = bookedLeadIds.size;

  const bookingRate =
    totalLeads > 0
      ? Number(((bookedLeads / totalLeads) * 100).toFixed(1))
      : 0;

  /*
   * Overall source performance.
   */
  const sourceMap = new Map<
    string,
    {
      leadCount: number;
      bookedLeadIds: Set<string>;
    }
  >();

  for (const lead of leads) {
    const source = normalizeSource(lead.lead_source);

    const current = sourceMap.get(source) ?? {
      leadCount: 0,
      bookedLeadIds: new Set<string>(),
    };

    current.leadCount += 1;

    if (lead.id && bookedLeadIds.has(lead.id)) {
      current.bookedLeadIds.add(lead.id);
    }

    sourceMap.set(source, current);
  }

  const sourceCounts: DashboardSourceCount[] = Array.from(
    sourceMap.entries()
  )
    .map(([source, values]) => {
      const bookedCount = values.bookedLeadIds.size;

      return {
        source,
        leadCount: values.leadCount,
        bookedCount,
        bookingRate:
          values.leadCount > 0
            ? Number(
                (
                  (bookedCount / values.leadCount) *
                  100
                ).toFixed(1)
              )
            : 0,
      };
    })
    .sort((a, b) => {
      if (b.leadCount !== a.leadCount) {
        return b.leadCount - a.leadCount;
      }

      return b.bookingRate - a.bookingRate;
    });

  const topSource = sourceCounts[0] ?? null;

  /*
   * Campaign performance.
   */
  const campaignMap = new Map<
    string,
    {
      leadCount: number;
      bookedLeadIds: Set<string>;
    }
  >();

  for (const lead of leads) {
    if (!lead.campaign_id) {
      continue;
    }

    const current = campaignMap.get(lead.campaign_id) ?? {
      leadCount: 0,
      bookedLeadIds: new Set<string>(),
    };

    current.leadCount += 1;

    if (lead.id && bookedLeadIds.has(lead.id)) {
      current.bookedLeadIds.add(lead.id);
    }

    campaignMap.set(lead.campaign_id, current);
  }

  const campaignSummaries: DashboardCampaignSummary[] =
    campaigns
      .map((campaign) => {
        const values = campaignMap.get(campaign.id) ?? {
          leadCount: 0,
          bookedLeadIds: new Set<string>(),
        };

        const bookedCount = values.bookedLeadIds.size;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          leadCount: values.leadCount,
          bookedCount,
          bookingRate:
            values.leadCount > 0
              ? Number(
                  (
                    (bookedCount / values.leadCount) *
                    100
                  ).toFixed(1)
                )
              : 0,
        };
      })
      .sort((a, b) => {
        if (b.leadCount !== a.leadCount) {
          return b.leadCount - a.leadCount;
        }

        return b.bookingRate - a.bookingRate;
      });

  const campaignLeadCount = campaignSummaries.reduce(
    (total, campaign) => total + campaign.leadCount,
    0
  );

  const campaignBookedCount = campaignSummaries.reduce(
    (total, campaign) => total + campaign.bookedCount,
    0
  );

  const campaignBookingRate =
    campaignLeadCount > 0
      ? Number(
          (
            (campaignBookedCount / campaignLeadCount) *
            100
          ).toFixed(1)
        )
      : 0;

  const topCampaign =
    campaignSummaries.find(
      (campaign) => campaign.leadCount > 0
    ) ?? null;

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    bookedLeads,
    closedLeads,
    bookingRate,

    sourceCounts,
    topSource,

    campaignCount: campaigns.length,
    activeCampaignCount: campaigns.filter(
      (campaign) => campaign.status === "active"
    ).length,
    campaignLeadCount,
    campaignBookedCount,
    campaignBookingRate,
    campaignSummaries,
    topCampaign,
  };
}