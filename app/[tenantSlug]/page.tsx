import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/db/tenants";
import { ContractorHero } from "@/components/tenant/ContractorHero"; 
import { ChatWidget } from "@/components/chat/ChatWidget";

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

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return {
      title: "Contractor Not Found",
      description: "The contractor page you requested could not be found.",
    };
  }

  return {
    title: `${tenant.businessName} | Digital Front Door`,
    description:
      tenant.tagline ??
      `Connect instantly with ${tenant.businessName} for service inquiries and lead capture.`,
  };
}

export default async function TenantPage({ params, searchParams  }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const query = searchParams ? await searchParams : {};
  const leadSource = query.source || "website";
  const autoOpenChat = query.openChat === "0" ? false : true;
  const isEmbed = query.embed === "1";

  if (isEmbed) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-white p-3">
        <ChatWidget
          tenant={tenant}
          autoOpen={autoOpenChat}
          leadSource={leadSource}
          variant="embed"
        />
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-white">
      <ContractorHero tenant={tenant} />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-3 text-sm text-gray-600">
              {tenant.businessName} helps local customers get quotes, ask
              questions, and connect quickly without waiting for callbacks.
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-700">
            {tenant.primaryPhone && (
              <p>
                <span className="font-medium">Phone:</span> {tenant.primaryPhone}
              </p>
            )}
              {tenant.email && <p><span className="font-medium">Email:</span> {tenant.email}</p>}
              {tenant.serviceAreaSummary && (
                <p>
                  <span className="font-medium">Service Area:</span>{" "}
                  {tenant.serviceAreaSummary}
                </p>
              )}
            </div>
          </div>

          <ChatWidget
            tenant={tenant}
            autoOpen={autoOpenChat}
            leadSource={leadSource}
          />
        </div>
      </section>
    </main>
  );
}