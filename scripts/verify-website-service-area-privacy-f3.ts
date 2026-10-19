/**
 * F3B service area privacy + public DTO. Run: npx tsx scripts/verify-website-service-area-privacy-f3.ts
 */
import fs from "node:fs";
import path from "node:path";
import type { Tenant } from "../lib/types/tenant";
import {
  buildPublicChatTenant,
  buildPublicTenantView,
  PRIVATE_ADDRESS_SERIALIZATION_KEYS,
} from "../lib/website/publicTenant";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "t1",
    slug: "demo",
    businessName: "Demo Co",
    serviceAreaSummary: "North County",
    serviceCities: ["Vista", "Oceanside"],
    addressLine1: "123 Private Home St",
    addressLine2: "Unit B",
    city: "Hidden City",
    state: "CA",
    zip: "92081",
    showBusinessAddressPublicly: false,
    shareBusinessAddressInChat: true,
    serviceRadiusMiles: null,
    ...overrides,
  } as Tenant;
}

// A — private address
{
  const full = tenant();
  const pub = buildPublicTenantView(full);
  assert(!pub.publicBusinessAddress, "no public address when flag false");
  assert(
    !("addressLine1" in pub),
    "public DTO must not include addressLine1"
  );
  assert(pub.serviceAreaSummary === "North County", "summary remains public");
  assert(pub.serviceCities?.length === 2, "cities remain public");

  const chat = buildPublicChatTenant(full);
  assert(chat.slug === "demo", "chat tenant slug");
  assert(!("addressLine1" in chat), "chat DTO has no address");
}

// B — public storefront
{
  const full = tenant({ showBusinessAddressPublicly: true });
  const pub = buildPublicTenantView(full);
  assert(
    Boolean(pub.publicBusinessAddress?.includes("123 Private Home St")),
    "formatted address when public"
  );
  assert(!("addressLine1" in pub), "still no raw addressLine1 on DTO");
}

// C — no address
{
  const full = tenant({
    addressLine1: "",
    city: "",
    state: "",
    zip: "",
    showBusinessAddressPublicly: true,
  });
  const pub = buildPublicTenantView(full);
  assert(!pub.publicBusinessAddress, "no empty address UI field");
  assert(pub.serviceCities?.length === 2, "service area still works");
}

// D — toggle off
{
  const pub = buildPublicTenantView(
    tenant({ showBusinessAddressPublicly: false })
  );
  assert(!pub.publicBusinessAddress, "toggle false removes address");
}

// E — independence (flags stored on server model only)
{
  const full = tenant({
    showBusinessAddressPublicly: false,
    shareBusinessAddressInChat: true,
  });
  assert(full.shareBusinessAddressInChat === true, "chat flag preserved on server");
  assert(full.showBusinessAddressPublicly === false, "public flag preserved");
  const pub = buildPublicTenantView(full);
  assert(!pub.publicBusinessAddress, "public off");
  assert(
    !("shareBusinessAddressInChat" in pub),
    "chat permission not on public DTO"
  );
}

// F — radius null preserved in mapper logic (SettingsForm must not default 25)
const settingsForm = fs.readFileSync(
  path.join(process.cwd(), "components/admin/settings/SettingsForm.tsx"),
  "utf8"
);
assert(
  !settingsForm.includes("serviceRadiusMiles || 25"),
  "SettingsForm must not default radius to 25"
);
assert(
  settingsForm.includes("serviceRadiusMiles ?? null"),
  "SettingsForm initializes radius as null when unset"
);

const apiRoute = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/api/admin/tenants/[tenantSlug]/route.ts"
  ),
  "utf8"
);
assert(
  apiRoute.includes("show_business_address_publicly"),
  "API persists showBusinessAddressPublicly"
);

const tenantPage = fs.readFileSync(
  path.join(process.cwd(), "app/[tenantSlug]/page.tsx"),
  "utf8"
);
assert(
  tenantPage.includes("buildPublicTenantView"),
  "hosted page uses public tenant view"
);
assert(
  tenantPage.includes("buildPublicChatTenant"),
  "embed uses public chat tenant"
);

for (const key of PRIVATE_ADDRESS_SERIALIZATION_KEYS) {
  const pub = buildPublicTenantView(tenant());
  assert(!(key in pub), `public view must omit ${key}`);
}

console.log("verify-website-service-area-privacy-f3: OK");
