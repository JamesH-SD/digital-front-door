import { redirect } from "next/navigation";
import CreateBusinessForm from "@/components/auth/CreateBusinessForm";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFirstUserTenantMembership } from "@/lib/auth/tenantAccess";

export default async function CreateBusinessPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getFirstUserTenantMembership(user.id);

  if (membership?.tenantSlug) {
    redirect(`/onboarding/${membership.tenantSlug}`);
  }

  return <CreateBusinessForm />;
}