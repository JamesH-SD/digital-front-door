"use client";

import { useState } from "react";
import { buildWidgetEmbedSnippet } from "@/lib/customer-entry/buildCustomerEntryUrls";

type Props = {
  origin: string;
  tenantSlug: string;
  copyButtonLabel?: string;
  description?: string;
};

export default function WidgetEmbedSnippetCard({
  origin,
  tenantSlug,
  copyButtonLabel = "Copy Code",
  description = "Add this snippet before the closing body tag on pages where customers should reach your AI receptionist.",
}: Props) {
  const [copied, setCopied] = useState(false);
  const embedSnippet = buildWidgetEmbedSnippet(origin, tenantSlug);

  async function handleCopy() {
    await navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-dashed border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Embed snippet</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="saas-button-secondary px-3 py-1 text-xs font-medium"
        >
          {copied ? "Copied" : copyButtonLabel}
        </button>
      </div>

      <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
        {embedSnippet}
      </pre>
    </div>
  );
}
