/**
 * F3 receptionist structured Business Identity address privacy.
 * Run: npx tsx scripts/verify-receptionist-address-privacy-f3.ts
 */
import type { Tenant } from "../lib/types/tenant";
import type { ChatSession } from "../lib/types/chat";
import {
  buildReceptionistLocationContextLines,
  receptionistContextIncludesPrivateStreet,
} from "../lib/ai/buildReceptionistTenantContext";
import { buildKnownContext } from "../lib/ai/generateChatTurn";
import { buildPostCaptureTenantContext } from "../lib/ai/generatePostCaptureTurn";
import {
  assembleReceptionistPromptContext,
  receptionistTenantContextIncludesPrivateStreet,
} from "../lib/ai/assembleReceptionistPromptContext";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const STREET = "1153 Eklund Ct";

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "1",
    slug: "demo",
    businessName: "Demo Co",
    addressLine1: STREET,
    city: "Vista",
    state: "CA",
    zip: "92083",
    serviceAreaSummary: "North County San Diego",
    serviceCities: ["Vista", "San Marcos"],
    shareBusinessAddressInChat: false,
    ...overrides,
  } as Tenant;
}

const emptySession = { intakeData: {}, leadCaptured: false } as ChatSession;

// Structured BI address OFF — tenant context (pre-capture path)
{
  const t = tenant({ shareBusinessAddressInChat: false });
  const { tenantContextBlock } = assembleReceptionistPromptContext({
    tenant: t,
    session: emptySession,
    tenantKnowledge: [],
  });
  assert(
    !receptionistTenantContextIncludesPrivateStreet(t, tenantContextBlock),
    "tenant context omits structured street when sharing off"
  );
  assert(tenantContextBlock.includes("Service Cities"), "service cities in tenant context");
  assert(
    tenantContextBlock.includes("North County San Diego"),
    "service area summary in tenant context"
  );
}

// Structured BI address ON
{
  const t = tenant({ shareBusinessAddressInChat: true });
  const { tenantContextBlock } = assembleReceptionistPromptContext({
    tenant: t,
    session: emptySession,
  });
  assert(
    receptionistTenantContextIncludesPrivateStreet(t, tenantContextBlock),
    "tenant context includes street when sharing on"
  );
}

// Normal chat known context
{
  const off = buildKnownContext(emptySession, tenant({ shareBusinessAddressInChat: false }));
  assert(!receptionistContextIncludesPrivateStreet(tenant(), off), "buildKnownContext off");

  const on = buildKnownContext(
    emptySession,
    tenant({ shareBusinessAddressInChat: true })
  );
  assert(
    receptionistContextIncludesPrivateStreet(tenant({ shareBusinessAddressInChat: true }), on),
    "buildKnownContext on"
  );
}

// Post-capture tenant context
{
  const off = buildPostCaptureTenantContext(tenant({ shareBusinessAddressInChat: false }));
  assert(!receptionistContextIncludesPrivateStreet(tenant(), off), "post-capture off");

  const on = buildPostCaptureTenantContext(tenant({ shareBusinessAddressInChat: true }));
  assert(
    receptionistContextIncludesPrivateStreet(tenant({ shareBusinessAddressInChat: true }), on),
    "post-capture on"
  );
}

// Fail-closed: false / null / undefined
for (const sharing of [false, null, undefined] as const) {
  const lines = buildReceptionistLocationContextLines(
    tenant({ shareBusinessAddressInChat: sharing as boolean | undefined })
  ).join("\n");
  assert(!lines.includes(STREET), `sharing ${String(sharing)} omits street`);
  assert(lines.includes("Service Cities"), `sharing ${String(sharing)} keeps cities`);
}

console.log("verify-receptionist-address-privacy-f3: OK");
