import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

const websiteSections = [
  ["brand", "Brand", "Logo, colors, and visual identity."],
  ["hero", "Hero", "Headline, intro text, CTA labels, and hero image."],
  ["why-us", "Why Us", "Trust points and supporting image."],
  ["services", "Services", "Service cards, images, descriptions, and CTAs."],
  ["banner", "CTA Banner", "Mid-page call-to-action content."],
  ["service-areas", "Service Areas", "Where the business provides service."],
  ["about", "About", "About section text and image."],
  ["reviews", "Reviews", "Review section heading and future testimonials."],
  ["faqs", "FAQs", "FAQ section heading and customer guidance."],
  ["social-links", "Social Links", "Facebook, Instagram, Yelp, and Google links."],
];

export default async function WebsitePage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Website</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the public website one section at a time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {websiteSections.map(([slug, title, description]) => (
          <Link
            key={slug}
            href={`/admin/${tenant.slug}/website/${slug}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
          >
            <h2 className="text-base font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}