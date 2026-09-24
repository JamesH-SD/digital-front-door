import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";
import { normalizeSafeInternalReturnTo } from "@/lib/calendar/safeOAuthReturnTo";
import { getTenantBySlug } from "@/lib/db/tenants";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";
import { getTenantSetupReadiness } from "@/lib/readiness/getTenantSetupReadiness";
import { loadTenantSetupReadinessDependencies } from "@/lib/readiness/loadTenantSetupReadinessDependencies";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildOnboardingReturnPath(
  tenantSlug: string,
  query: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  const search = params.toString();
  return search
    ? `/onboarding/${tenantSlug}?${search}`
    : `/onboarding/${tenantSlug}`;
}

export default async function OnboardingPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const query = searchParams ? await searchParams : {};

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    const returnPath = buildOnboardingReturnPath(tenantSlug, query);
    const safeReturn = normalizeSafeInternalReturnTo(
      returnPath,
      `/onboarding/${tenantSlug}`
    );
    redirect(`/login?returnTo=${encodeURIComponent(safeReturn)}`);
  }

  const membership = await getUserTenantMembership({
    userId: user.id,
    tenantSlug,
  });

  if (!membership) {
    redirect("/unauthorized");
  }

  const readinessDependencies = await loadTenantSetupReadinessDependencies(
    tenant.slug
  );
  const setupReadiness = getTenantSetupReadiness({
    tenant,
    ...readinessDependencies,
  });

  return (
    <AuthExperienceShell maxWidth="max-w-6xl">
      <Suspense
        fallback={
          <p className="py-10 text-center text-sm text-gray-600">
            Loading setup wizard…
          </p>
        }
      >
        <OnboardingWizard
          tenant={tenant}
          setupReadiness={setupReadiness}
          readinessDependencies={readinessDependencies}
        />
      </Suspense>
    </AuthExperienceShell>
  );
}
