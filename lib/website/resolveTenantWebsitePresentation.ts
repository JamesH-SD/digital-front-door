import type { Tenant, TenantWebsiteSettings } from "@/lib/types/tenant";

const DEFAULT_PRIMARY = "#1F3B4D";
const DEFAULT_ACCENT = "#4E9271";

const GENERIC_HERO_HEADLINE_SUFFIX = " makes it easy to get started.";

const GENERIC_HERO_DESCRIPTION =
  "Ask a question, request an estimate, or schedule the next step. Our AI receptionist helps collect the right details so you do not have to wait for a callback.";

const GENERIC_ABOUT_BODY_SUFFIX =
  " helps customers ask questions, share details, and coordinate next steps through a simple online experience.";

function trimOrEmpty(value?: string | null): string {
  return value?.trim() || "";
}

/**
 * Website-specific override → tenant/business truth → restrained generic fallback.
 */
export function resolveWebsiteHeroHeadline(tenant: Tenant): string {
  const settings = tenant.websiteSettings || {};
  const override = trimOrEmpty(settings.heroHeadline);
  if (override) return override;

  const tagline = trimOrEmpty(tenant.tagline);
  if (tagline) return tagline;

  return `${tenant.businessName}${GENERIC_HERO_HEADLINE_SUFFIX}`;
}

export function resolveWebsiteHeroDescription(tenant: Tenant): string {
  const settings = tenant.websiteSettings || {};
  const override = trimOrEmpty(settings.heroDescription);
  if (override) return override;

  const about = trimOrEmpty(tenant.aboutUs);
  if (about) return about;

  return GENERIC_HERO_DESCRIPTION;
}

export function resolveWebsiteAboutBody(tenant: Tenant): string {
  const settings = tenant.websiteSettings || {};
  const override = trimOrEmpty(settings.aboutBody);
  if (override) return override;

  const about = trimOrEmpty(tenant.aboutUs);
  if (about) return about;

  return `${tenant.businessName}${GENERIC_ABOUT_BODY_SUFFIX}`;
}

export type TenantWebsiteBrandColors = {
  primary: string;
  primaryHover: string;
  primaryButtonText: string;
  accent: string;
  accentHover: string;
  accentButtonText: string;
};

function normalizeHex(color: string, fallback: string): string {
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex, DEFAULT_ACCENT).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * (1 - amount))));

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function resolveWebsiteBrandColors(
  tenant: Tenant,
  settings: TenantWebsiteSettings = tenant.websiteSettings || {}
): TenantWebsiteBrandColors {
  const primary = normalizeHex(
    trimOrEmpty(settings.primaryColor) || trimOrEmpty(tenant.primaryColor),
    DEFAULT_PRIMARY
  );

  const accent = normalizeHex(trimOrEmpty(settings.accentColor), DEFAULT_ACCENT);

  const primaryHover = darkenHex(primary, 0.12);
  const primaryButtonText =
    relativeLuminance(primary) > 0.45 ? "#111827" : "#ffffff";

  const accentHover = darkenHex(accent, 0.12);
  const accentButtonText =
    relativeLuminance(accent) > 0.45 ? "#111827" : "#ffffff";

  return {
    primary,
    primaryHover,
    primaryButtonText,
    accent,
    accentHover,
    accentButtonText,
  };
}

/** For verification — hero headline resolves from tenant tagline (no website override). */
export function websiteHeroUsesTenantTagline(tenant: Tenant): boolean {
  const settings = tenant.websiteSettings || {};
  if (trimOrEmpty(settings.heroHeadline)) {
    return false;
  }
  return Boolean(trimOrEmpty(tenant.tagline));
}

/** For verification — about body resolves from tenant aboutUs (no website override). */
export function websiteAboutUsesTenantAbout(tenant: Tenant): boolean {
  const settings = tenant.websiteSettings || {};
  if (trimOrEmpty(settings.aboutBody)) {
    return false;
  }
  return Boolean(trimOrEmpty(tenant.aboutUs));
}
