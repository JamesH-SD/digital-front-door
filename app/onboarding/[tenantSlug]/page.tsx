import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";
import { getTenantBySlug } from "@/lib/db/tenants";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function OnboardingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserTenantMembership({
    userId: user.id,
    tenantSlug,
  });

  if (!membership) {
    redirect("/unauthorized");
  }

  return <OnboardingWizard tenant={tenant} />;
}