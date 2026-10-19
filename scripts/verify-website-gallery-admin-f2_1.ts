/**
 * F2.1 Project Gallery admin discoverability. Run: npx tsx scripts/verify-website-gallery-admin-f2_1.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  getWebsiteBuilderProgress,
  getWebsiteBuilderProgressPercent,
} from "../lib/website/getWebsiteBuilderProgress";
import type { Tenant } from "../lib/types/tenant";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const websitePage = fs.readFileSync(
  path.join(process.cwd(), "app/admin/[tenantSlug]/website/page.tsx"),
  "utf8"
);

assert(
  !websitePage.includes("Optional sections"),
  "Website admin must not use separate Optional sections card"
);

assert(
  !websitePage.includes("getWebsiteOptionalEnhancements"),
  "Website admin must not use getWebsiteOptionalEnhancements"
);

const sectionPage = fs.readFileSync(
  path.join(process.cwd(), "app/admin/[tenantSlug]/website/[section]/page.tsx"),
  "utf8"
);

assert(
  sectionPage.includes('"project-gallery"'),
  "project-gallery section route must be registered"
);

const panel = fs.readFileSync(
  path.join(process.cwd(), "components/admin/settings/WebsiteSettingsPanel.tsx"),
  "utf8"
);

assert(
  panel.includes('shouldShow("projectGallery")'),
  "WebsiteSettingsPanel must include projectGallery editor"
);

const baseTenant = {
  id: "1",
  slug: "test",
  businessName: "Test",
  websiteSettings: {
    logoUrl: "https://logo",
    faviconUrl: "https://icon",
    heroHeadline: "Hi",
    whyUsTitle: "Why",
    services: [{ id: "1", title: "S" }],
    aboutBody: "About",
    faqs: [{ id: "1", question: "Q", answer: "A" }],
  },
  primaryPhone: "555",
  email: "a@b.com",
  hours: { monday: { open: "09:00", close: "17:00", closed: false } },
} as Tenant;

const grid = getWebsiteBuilderProgress(baseTenant);
assert(grid.length === 10, "Website setup grid has 10 rows including gallery");

const galleryRow = grid.find((item) => item.label === "Project Gallery");
assert(Boolean(galleryRow), "Project Gallery row exists");
assert(galleryRow!.href === "project-gallery", "gallery links to project-gallery");
assert(galleryRow!.countsTowardReadiness === false, "gallery excluded from readiness");

const servicesIndex = grid.findIndex((item) => item.label === "Services added");
const galleryIndex = grid.findIndex((item) => item.label === "Project Gallery");
assert(galleryIndex === servicesIndex + 1, "gallery follows Services in grid order");

const percent = getWebsiteBuilderProgressPercent(baseTenant);
assert(percent.totalCount === 9, "readiness still 9 essentials");
assert(percent.completedCount === 9 && percent.percent === 100, "gallery does not block 100%");

const emptyGallery = getWebsiteBuilderProgress({
  ...baseTenant,
  websiteSettings: { ...baseTenant.websiteSettings, projectGallery: [] },
});
const emptyGalleryRow = emptyGallery.find((item) => item.label === "Project Gallery");
assert(emptyGalleryRow?.complete === false, "empty gallery not complete");
assert(
  emptyGalleryRow?.incompleteStatus === "optional",
  "empty gallery uses optional status"
);

console.log("verify-website-gallery-admin-f2_1: OK");
