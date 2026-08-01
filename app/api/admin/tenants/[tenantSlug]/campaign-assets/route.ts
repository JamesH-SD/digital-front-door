import { NextRequest, NextResponse } from "next/server";
import {
  createCampaignAsset,
  deleteCampaignAsset,
  getCampaignAssets,
  updateCampaignAsset,
} from "@/lib/db/campaign-asset";

function trimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get("campaignId")?.trim() || undefined;

    const assets = await getCampaignAssets({
      tenantSlug,
      campaignId,
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Campaign asset load error:", error);

    return NextResponse.json(
      { error: "Failed to load marketing assets." },
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

    const campaignId = trimmedString(body.campaignId);
    const name = trimmedString(body.name);
    const source = trimmedString(body.source);

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Asset name is required." },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: "Marketing source is required." },
        { status: 400 }
      );
    }

    const asset = await createCampaignAsset({
      tenantSlug,
      campaignId,
      name,
      source,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("Campaign asset create error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create marketing asset.",
      },
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

    const campaignAssetId = trimmedString(body.campaignAssetId);

    if (!campaignAssetId) {
      return NextResponse.json(
        { error: "Campaign asset ID is required." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;

    const source =
      typeof body.source === "string" ? body.source.trim() : undefined;

    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : undefined;

    if (
      name === undefined &&
      source === undefined &&
      isActive === undefined
    ) {
      return NextResponse.json(
        { error: "No valid asset updates were provided." },
        { status: 400 }
      );
    }

    if (typeof name === "string" && !name) {
      return NextResponse.json(
        { error: "Asset name cannot be empty." },
        { status: 400 }
      );
    }

    const asset = await updateCampaignAsset({
      tenantSlug,
      campaignAssetId,
      name,
      source,
      isActive,
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Campaign asset update error:", error);

    return NextResponse.json(
      { error: "Failed to update marketing asset." },
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

    const campaignAssetId =
      searchParams.get("campaignAssetId")?.trim() || "";

    if (!campaignAssetId) {
      return NextResponse.json(
        { error: "Campaign asset ID is required." },
        { status: 400 }
      );
    }

    await deleteCampaignAsset({
      tenantSlug,
      campaignAssetId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign asset delete error:", error);

    return NextResponse.json(
      { error: "Failed to delete marketing asset." },
      { status: 500 }
    );
  }
}