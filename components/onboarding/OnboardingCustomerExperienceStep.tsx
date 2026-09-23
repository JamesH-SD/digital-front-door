"use client";

import Link from "next/link";
import CopyableLinkRow from "@/components/admin/customer-entry/CopyableLinkRow";
import WidgetEmbedSnippetCard from "@/components/admin/customer-entry/WidgetEmbedSnippetCard";
import {
  buildExistingWebsiteConversationQrUrl,
  buildHostedBrowseUrl,
  buildHostedConversationQrUrl,
} from "@/lib/customer-entry/buildCustomerEntryUrls";
import { useClientAppOrigin } from "@/lib/hooks/useClientAppOrigin";
import type { TenantDeploymentMode } from "@/lib/types/tenant";

type Props = {
  tenantSlug: string;
  deploymentMode: TenantDeploymentMode | null;
  websiteUrl: string;
  websiteStatus?: "draft" | "published";
};

export default function OnboardingCustomerExperienceStep({
  tenantSlug,
  deploymentMode,
  websiteUrl,
  websiteStatus = "draft",
}: Props) {
  const origin = useClientAppOrigin();

  const isPublished = websiteStatus === "published";
  const existingSiteQrUrl = buildExistingWebsiteConversationQrUrl(websiteUrl);
  const hostedConversationQrUrl = origin
    ? buildHostedConversationQrUrl(origin, tenantSlug)
    : "";
  const previewHref = `/${tenantSlug}?preview=true`;
  const websiteBuilderHref = `/admin/${tenantSlug}/website`;

  if (deploymentMode === "existing_site") {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-6 text-gray-700">
          Add the Contactor snippet to your existing website so customers can
          open your AI receptionist from the pages where you install it.
        </p>

        <WidgetEmbedSnippetCard
          origin={origin || "http://localhost:3000"}
          tenantSlug={tenantSlug}
          description="Paste this code before the closing body tag on your site (or ask your web person to add it)."
        />

        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-6 text-gray-700">
          <p className="font-semibold text-gray-900">Installation tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Add the snippet once on each page where you want the receptionist.</li>
            <li>After saving, open your live site and look for the chat launcher.</li>
            <li>Contactor does not verify installation automatically—you&apos;ll know it works when you see the widget on your site.</li>
          </ul>
        </div>

        <CopyableLinkRow
          label="Customer QR"
          description="This QR opens your existing website and starts a conversation with your receptionist. The Contactor widget must be installed on that site for chat to appear."
          value={existingSiteQrUrl}
          disabledMessage="Add your website URL on the Business step to generate a customer QR link."
          fileName={`${tenantSlug}-customer-qr.png`}
          copyButtonLabel="Copy Link"
        />
      </div>
    );
  }

  if (deploymentMode === "hosted") {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-6 text-gray-700">
          Contactor can provide a customer-facing website using the business
          information you already entered. Customize pages, branding, and content
          in the Website Builder—then publish when you are ready for customers to
          visit.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="saas-button-secondary px-4 py-2 text-sm font-semibold"
          >
            Preview Website
          </Link>

          <Link
            href={websiteBuilderHref}
            className="saas-button-accent px-4 py-2 text-sm font-semibold"
          >
            Continue Website Setup
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-6 text-gray-700">
          {isPublished ? (
            <p>
              Your website is published. Customers can use your public browse URL
              and a customer QR that opens a conversation with your receptionist.
            </p>
          ) : (
            <p>
              Your website is not published yet. Preview lets you review the site
              while it is still in draft. Publish from Website when you are ready—
              until then, the public browse URL and customer QR are not available
              for customers.
            </p>
          )}
        </div>

        {isPublished ? (
          <>
            <CopyableLinkRow
              label="Public website"
              description="Normal browsing link for your Contactor-hosted website (does not auto-open chat)."
              value={origin ? buildHostedBrowseUrl(origin, tenantSlug) : ""}
              fileName={`${tenantSlug}-website.png`}
              copyButtonLabel="Copy Link"
            />

            <CopyableLinkRow
              label="Customer QR"
              description="Use on signs, cards, and print materials. Scanning opens your hosted site and starts a conversation with your receptionist."
              value={hostedConversationQrUrl}
              fileName={`${tenantSlug}-customer-qr.png`}
              copyButtonLabel="Copy Link"
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-4 text-sm text-gray-600">
            Customer QR and the public browse link will be available after you
            publish your website from the Website Builder.
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      Choose whether you have an existing website on the Business step to continue
      customer experience setup.
    </p>
  );
}
