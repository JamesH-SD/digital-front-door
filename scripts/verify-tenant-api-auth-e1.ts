/**
 * E1 structural auth checks (no HTTP). Run: npx tsx scripts/verify-tenant-api-auth-e1.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "app/api/admin/tenants/[tenantSlug]");

const OAUTH_CALLBACK_EXCEPTIONS = new Set([
  "calendar-connections/google/callback/route.ts",
]);

function listRouteFiles(dir: string, prefix = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...listRouteFiles(path.join(dir, entry.name), rel));
    } else if (entry.name === "route.ts") {
      files.push(rel);
    }
  }

  return files;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const routeFiles = listRouteFiles(ROOT);

const unprotected: string[] = [];

for (const rel of routeFiles) {
  if (OAUTH_CALLBACK_EXCEPTIONS.has(rel)) {
    continue;
  }

  const content = fs.readFileSync(path.join(ROOT, rel), "utf8");

  const hasGuard =
    content.includes("requireTenantAccess(") ||
    content.includes("requireTenantCalendarAccess(") ||
    (content.includes("userHasTenantAccess(") &&
      content.includes("getCurrentUser("));

  if (!hasGuard) {
    unprotected.push(rel);
  }
}

assert(
  unprotected.length === 0,
  `Admin tenant routes missing tenant access guard: ${unprotected.join(", ")}`
);

const aiRoutes = [
  "app/api/ai/lead-copilot/route.ts",
  "app/api/ai/lead-summary/route.ts",
  "app/api/ai/lead-insights/route.ts",
  "app/api/ai/suggested-reply/route.ts",
];

for (const rel of aiRoutes) {
  const content = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
  assert(
    content.includes("requireLeadAccess(") ||
      content.includes("requireLeadAiAccess("),
    `${rel} must use requireLeadAccess`
  );
}

const leadAdminRoutes = [
  "app/api/leads/[leadId]/route.ts",
  "app/api/leads/[leadId]/status/route.ts",
  "app/api/leads/[leadId]/appointment/route.ts",
];

const leadPublicExceptions = new Set([
  "app/api/leads/[leadId]/images/route.ts",
]);

for (const rel of leadAdminRoutes) {
  const content = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
  assert(
    content.includes("requireLeadAccess("),
    `${rel} must use requireLeadAccess`
  );
}

for (const rel of leadPublicExceptions) {
  const content = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
  assert(
    !content.includes("requireLeadAccess("),
    `${rel} must remain public (customer chat image upload)`
  );
}

console.log(
  `verify-tenant-api-auth-e1: OK (${routeFiles.length} admin route files, ${aiRoutes.length} lead AI routes, ${leadAdminRoutes.length} admin lead routes, ${leadPublicExceptions.size} public lead route exceptions)`
);
