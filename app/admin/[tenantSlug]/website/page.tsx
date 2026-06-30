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
      label: "Home page headline",
      complete: Boolean(settings.heroHeadline || tenant?.tagline),
      href: "hero",
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

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Website readiness
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {completedCount} of {readinessItems.length} essentials complete.
              </p>
            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              {Math.round((completedCount / readinessItems.length) * 100)}%
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {readinessItems.map((item) => (
              <Link
                key={item.label}
                href={
                  item.href === "../settings"
                    ? `/admin/${tenant.slug}/settings`
                    : `/admin/${tenant.slug}/website/${item.href}`
                }
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <span className="font-medium text-gray-800">{item.label}</span>

                <span
                  className={
                    item.complete
                      ? "text-xs font-bold text-emerald-700"
                      : "text-xs font-bold text-amber-700"
                  }
                >
                  {item.complete ? "Complete" : "Needs attention"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <h2 className="text-lg font-bold text-gray-950">Edit website</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the main areas customers see before contacting you.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/admin/${tenant.slug}/website/brand`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              Brand
            </Link>

            <Link
              href={`/admin/${tenant.slug}/website/hero`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              Home Page
            </Link>

            <Link
              href={`/admin/${tenant.slug}/website/services`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              Services
            </Link>

            <Link
              href={`/admin/${tenant.slug}/website/project-gallery`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              Gallery
            </Link>

            <Link
              href={`/admin/${tenant.slug}/website/faqs`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              FAQs
            </Link>

            <Link
              href={`/admin/${tenant.slug}/website/social-links`}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50/50"
            >
              Social Links
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}