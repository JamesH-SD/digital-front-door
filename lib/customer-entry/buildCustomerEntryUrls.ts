export function buildExistingWebsiteConversationQrUrl(websiteUrl?: string | null) {
  const trimmed = websiteUrl?.trim();
  if (!trimmed) return "";

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    url.searchParams.set("source", "qr");
    url.searchParams.set("openChat", "1");
    return url.toString();
  } catch {
    return "";
  }
}

export function buildHostedConversationQrUrl(origin: string, tenantSlug: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(tenantSlug)}?source=qr&openChat=1`;
}

export function buildHostedBrowseUrl(origin: string, tenantSlug: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(tenantSlug)}`;
}

export function buildWidgetScriptUrl(origin: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}/widget.js`;
}

export function buildWidgetEmbedSnippet(origin: string, tenantSlug: string) {
  const scriptUrl = buildWidgetScriptUrl(origin || "");
  return `<script src="${scriptUrl}" data-tenant="${tenantSlug}"></script>`;
}
