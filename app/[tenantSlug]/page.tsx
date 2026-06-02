import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/db/tenants";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { TenantWebsite } from "@/components/tenant/TenantWebsite";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
  searchParams?: Promise<{
    source?: string;
    openChat?: string;
    embed?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return {
      title: "Business Not Found",
      description: "The business page you requested could not be found.",
    };
  }

  return {
    title: `${tenant.businessName} | Digital Front Door`,
    description:
      tenant.tagline ??
      `Connect instantly with ${tenant.businessName} for questions, quotes, and scheduling.`,
  };
}

export default async function TenantPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const query = searchParams ? await searchParams : {};
  const leadSource = query.source || "website";
  const isEmbed = query.embed === "1";

  // QR/ad links can pass ?openChat=1 to open the AI immediately.
  // Normal website visitors see the trust page first with a visible AI launcher.
  const autoOpenChat = query.openChat === "1";

  if (isEmbed) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-white p-3">
        <ChatWidget
          tenant={tenant}
          autoOpen
          leadSource={leadSource}
          variant="embed"
        />
      </main>
    );
  }

  return (
    <TenantWebsite
      tenant={tenant}
      leadSource={leadSource}
      autoOpenChat={autoOpenChat}
    />
  );
}