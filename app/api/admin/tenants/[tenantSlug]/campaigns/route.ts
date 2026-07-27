import { NextRequest, NextResponse } from "next/server";
import {
  createTenantCampaign,
  deleteTenantCampaign,
  getTenantCampaigns,
  updateTenantCampaign,
} from "@/lib/db/campaigns";
import type { CampaignStatus } from "@/lib/types/campaign";

function isCampaignStatus(value: unknown): value is CampaignStatus {
  return value === "draft" || value === "active" || value === "ended";
}

function optionalTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const campaigns = await getTenantCampaigns(tenantSlug);

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Campaign load error:", error);

    return NextResponse.json(
      { error: "Failed to load campaigns." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const body = await request.json();

    const name = optionalTrimmedString(body.name) || "";

    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required." },
        { status: 400 }
      );
    }

    const campaign = await createTenantCampaign({
      tenantSlug,
      name,
      description: optionalTrimmedString(body.description),
      greetingMessage: optionalTrimmedString(body.greetingMessage),
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Campaign create error:", error);

    return NextResponse.json(
      { error: "Failed to create campaign." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const body = await request.json();

    const campaignId = optionalTrimmedString(body.campaignId) || "";

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;

    if (typeof body.name === "string" && !name) {
      return NextResponse.json(
        { error: "Campaign name cannot be empty." },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : body.description === null
          ? null
          : undefined;

    const greetingMessage =
      typeof body.greetingMessage === "string"
        ? body.greetingMessage.trim()
        : body.greetingMessage === null
          ? null
          : undefined;

    const status = isCampaignStatus(body.status)
      ? body.status
      : undefined;

    if (
      name === undefined &&
      description === undefined &&
      greetingMessage === undefined &&
      status === undefined
    ) {
      return NextResponse.json(
        { error: "No valid campaign updates were provided." },
        { status: 400 }
      );
    }

    const campaign = await updateTenantCampaign({
      tenantSlug,
      campaignId,
      name,
      description,
      greetingMessage,
      status,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Campaign update error:", error);

    return NextResponse.json(
      { error: "Failed to update campaign." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId")?.trim() || "";

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required." },
        { status: 400 }
      );
    }

    await deleteTenantCampaign({
      tenantSlug,
      campaignId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign delete error:", error);

    return NextResponse.json(
      { error: "Failed to delete campaign." },
      { status: 500 }
    );
  }
}