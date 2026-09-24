import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";
import { proposeWizardSetupContent } from "@/lib/ai/wizard/proposeWizardSetupContent";
import type {
  WizardAiAboutContext,
  WizardAiProposeAction,
  WizardAiTaglineContext,
} from "@/lib/ai/wizard/types";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

const ALLOWED_ACTIONS: WizardAiProposeAction[] = ["tagline", "about"];

function isAllowedAction(value: unknown): value is WizardAiProposeAction {
  return (
    typeof value === "string" &&
    ALLOWED_ACTIONS.includes(value as WizardAiProposeAction)
  );
}

function sanitizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function sanitizeStringArray(value: unknown, maxItems = 20, maxItemLength = 120) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength));

  return items.length > 0 ? items : undefined;
}

function parseTaglineContext(body: Record<string, unknown>): WizardAiTaglineContext {
  const context =
    body.context && typeof body.context === "object"
      ? (body.context as Record<string, unknown>)
      : {};

  return {
    businessName: sanitizeString(context.businessName, 200),
    primaryCategory: sanitizeString(context.primaryCategory, 200),
    serviceAreaSummary: sanitizeString(context.serviceAreaSummary, 500),
    existingTagline: sanitizeString(context.existingTagline, 120),
  };
}

function parseAboutContext(body: Record<string, unknown>): WizardAiAboutContext {
  const context =
    body.context && typeof body.context === "object"
      ? (body.context as Record<string, unknown>)
      : {};

  const deploymentMode = context.deploymentMode;

  return {
    businessName: sanitizeString(context.businessName, 200),
    primaryCategory: sanitizeString(context.primaryCategory, 200),
    serviceAreaSummary: sanitizeString(context.serviceAreaSummary, 500),
    servicesOffered: sanitizeStringArray(context.servicesOffered),
    ownerProvidedBusinessDescription: sanitizeString(
      context.ownerProvidedBusinessDescription ??
        context.existingAbout,
      800
    ),
    deploymentMode:
      deploymentMode === "existing_site" || deploymentMode === "hosted"
        ? deploymentMode
        : null,
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { tenantSlug } = await context.params;

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getUserTenantMembership({
      userId: user.id,
      tenantSlug,
    });

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    if (!isAllowedAction(body?.action)) {
      return NextResponse.json(
        { error: "action must be tagline or about" },
        { status: 400 }
      );
    }

    const action = body.action;
    const parsedContext =
      action === "tagline"
        ? parseTaglineContext(body)
        : parseAboutContext(body);

    const result = await proposeWizardSetupContent({
      action,
      context: parsedContext,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST wizard-ai/propose error:", error);

    return NextResponse.json(
      {
        status: "skipped",
        reason: "Could not generate a suggestion right now. You can continue typing manually.",
      },
      { status: 500 }
    );
  }
}
