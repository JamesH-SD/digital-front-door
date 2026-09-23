export function getReadinessAdminPaths(tenantSlug: string) {
  return {
    businessProfile: `/admin/${tenantSlug}/settings`,
    businessHours: `/admin/${tenantSlug}/settings/hours`,
    aiReceptionist: `/admin/${tenantSlug}/ai-chat`,
    knowledgeBase: `/admin/${tenantSlug}/knowledge`,
    calendar: `/admin/${tenantSlug}/settings/calendar`,
    website: `/admin/${tenantSlug}/website`,
  };
}
