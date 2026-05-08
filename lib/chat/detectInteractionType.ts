import type { TenantConfig } from "@/lib/types/tenant-config";

export function detectInteractionType(
  message: string,
  tenantConfig: TenantConfig
): "site_visit" | "phone_call" | null {
  const normalized = message.toLowerCase();

  for (const interaction of tenantConfig.interactionTypes) {
    if (!interaction.enabled) continue;

    for (const hint of interaction.intentHints) {
      if (normalized.includes(hint.toLowerCase())) {
        if (interaction.id === "site_visit") return "site_visit";
        if (interaction.id === "phone_call") return "phone_call";
      }
    }
  }

  return null;
}