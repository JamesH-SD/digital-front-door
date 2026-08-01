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
    preview?: string;
    campaign?: string;
    campaignAsset?: string;
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
    title: `${tenant.businessName} | Contactor`,
    description:
      tenant.tagline ??
      `Connect instantly with ${tenant.businessName} for questions, quotes, and scheduling.`,
    icons: tenant.websiteSettings?.faviconUrl
      ? {
          icon: tenant.websiteSettings.faviconUrl,
          shortcut: tenant.websiteSettings.faviconUrl,
          apple: tenant.websiteSettings.faviconUrl,
        }
      : undefined,
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
  const campaignId = query.campaign;
  const campaignAssetId = query.campaignAsset;
  const isEmbed = query.embed === "1";
  const isPreview = query.preview === "true" && tenant.websiteStatus !== "published";

  // QR/ad links can pass ?openChat=1 to open the AI immediately.
  // Normal website visitors see the trust page first with a visible AI launcher.
  const autoOpenChat = query.openChat === "1";

  if (
    tenant.websiteStatus !== "published" &&
    !isPreview
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">
            Website Coming Soon
          </h1>
  
          <p className="mt-3 text-sm leading-7 text-gray-600">
            This business website has not been published yet.
          </p>
        </div>
      </main>
    );
  }

  if (isEmbed) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-white p-3">
        <ChatWidget
          tenant={tenant}
          autoOpen
          leadSource={leadSource}
          campaignId={campaignId}
          campaignAssetId={campaignAssetId}
          variant="embed"
        />
      </main>
    );
  }

  return (
    <TenantWebsite
      tenant={tenant}
      leadSource={leadSource}
      campaignId={campaignId}
      campaignAssetId={campaignAssetId}
      autoOpenChat={autoOpenChat}
      isPreview={isPreview}
    />
  );
}