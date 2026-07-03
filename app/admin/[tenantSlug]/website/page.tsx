import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import WebsitePublishControls from "@/components/admin/website/WebsitePublishControls";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";
import TrialExpiredPage from "@/components/admin/billing/TrialExpiredPage";


type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function getReadinessItems(tenant: Awaited<ReturnType<typeof getTenantBySlug>>) {
  const settings = tenant?.websiteSettings || {};

  return [
    {
      label: "Logo added",
      complete: Boolean(settings.logoUrl),
      href: "brand",
    },
    
    {
      label: "Browser tab icon",
      complete: Boolean(settings.faviconUrl),
      href: "brand",
    },
    {
      label: "Home page headline",
      complete: Boolean(settings.heroHeadline),
      href: "hero",
    },
    {
      label: "Why Us section",
      complete: Boolean(settings.whyUsTitle),
      href: "why-us",
    },
    {
      label: "Services added",
      complete: Boolean(
        (settings.services && settings.services.length > 0) ||
          (tenant?.servicesOffered && tenant.servicesOffered.length > 0)
      ),
      href: "services",
    },
    
    {
      label: "About section",
      complete: Boolean(settings.aboutBody),
      href: "about",
    },
    {
      label: "FAQs added",
      complete: Boolean(settings.faqs && settings.faqs.length > 0),
      href: "faqs",
    },
    {
      label: "Business contact complete",
      complete: Boolean(tenant?.primaryPhone && tenant?.email),
      href: "../settings",
    },
  ];
}

export default async function WebsitePage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const subscriptionState = await getSubscriptionState(tenantSlug);

if (subscriptionState.isExpired) {
  return (
    <TrialExpiredPage
      tenantSlug={tenantSlug}
      title="Website Builder"
      description="Continue editing your branding, homepage, services, gallery, FAQs, social links, and publishing settings."
    />
  );
}

  const readinessItems = getReadinessItems(tenant);
  const completedCount = readinessItems.filter((item) => item.complete).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Website
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          Build and publish your website
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Preview your site, complete the essentials, and publish when you are ready.
        </p>
      </div>

      <WebsitePublishControls
        tenantSlug={tenant.slug}
        initialStatus={tenant.websiteStatus || "draft"}
        initialPublishedAt={tenant.websitePublishedAt}
      />

      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Website setup</h2>
            <p className="mt-1 text-sm text-gray-500">
              {completedCount} of {readinessItems.length} essentials complete. Review each section below.
            </p>
          </div>

          <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {Math.round((completedCount / readinessItems.length) * 100)}%
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {readinessItems.map((item) => (
            <Link
              key={item.label}
              href={
                item.href === "../settings"
                  ? `/admin/${tenant.slug}/settings`
                  : `/admin/${tenant.slug}/website/${item.href}`
              }
              className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm transition hover:border-orange-200 hover:bg-orange-50/50"
            >
              <span className="font-semibold text-gray-900">{item.label}</span>

              <span
                className={
                  item.complete
                    ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                    : "shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                }
              >
                {item.complete ? "Complete" : "Needs attention"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}