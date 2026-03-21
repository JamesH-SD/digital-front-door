import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/db/tenants";
import { ContractorHero } from "@/components/tenant/ContractorHero"; 
import { ChatWidget } from "@/components/chat/ChatWidget";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
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

export default async function TenantPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <ContractorHero tenant={tenant} />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-3 text-sm text-gray-600">
              {tenant.businessName} helps local customers get quotes, ask
              questions, and connect quickly without waiting for callbacks.
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-700">
              {tenant.phone && <p><span className="font-medium">Phone:</span> {tenant.phone}</p>}
              {tenant.email && <p><span className="font-medium">Email:</span> {tenant.email}</p>}
              {tenant.serviceAreaSummary && (
                <p>
                  <span className="font-medium">Service Area:</span>{" "}
                  {tenant.serviceAreaSummary}
                </p>
              )}
            </div>
          </div>

          <ChatWidget tenant={tenant} />
        </div>
      </section>
    </main>
  );
}