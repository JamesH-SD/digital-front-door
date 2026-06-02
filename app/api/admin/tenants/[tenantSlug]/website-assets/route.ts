import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

const ALLOWED_ASSET_TYPES = ["logo", "hero", "whyUs", "about", "service"] as const;

type AssetType = (typeof ALLOWED_ASSET_TYPES)[number];

function isAllowedAssetType(value: string): value is AssetType {
  return ALLOWED_ASSET_TYPES.includes(value as AssetType);
}

function getWebsiteSettingsKey(assetType: AssetType) {
    switch (assetType) {
      case "logo":
        return "logoUrl";
      case "hero":
        return "heroImageUrl";
      case "whyUs":
        return "whyUsImageUrl";
      case "about":
        return "aboutImageUrl";
      case "service":
        return null;
    }
  }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { tenantSlug } = await context.params;
    const formData = await request.formData();

    const file = formData.get("file");
    const assetTypeValue = String(formData.get("assetType") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!isAllowedAssetType(assetTypeValue)) {
      return NextResponse.json(
        { error: "Invalid asset type." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image is too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const extension = file.name.split(".").pop() || "jpg";
    const safeFileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${tenantSlug}/${assetTypeValue}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Website asset upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("tenant-assets")
      .getPublicUrl(path);

    const imageUrl = publicUrlData.publicUrl;
    const settingsKey = getWebsiteSettingsKey(assetTypeValue);

    if (!settingsKey) {
    return NextResponse.json({
        imageUrl,
    });
    }

    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("website_settings")
      .eq("slug", tenantSlug)
      .single();

    if (fetchError) {
      console.error("Failed loading tenant website settings:", fetchError);
      return NextResponse.json(
        { error: "Image uploaded, but settings could not be loaded." },
        { status: 500 }
      );
    }

    const nextWebsiteSettings = {
      ...(tenant?.website_settings || {}),
      [settingsKey]: imageUrl,
    };

    const { data, error: updateError } = await supabase
      .from("tenants")
      .update({
        website_settings: nextWebsiteSettings,
      })
      .eq("slug", tenantSlug)
      .select("website_settings")
      .single();

    if (updateError) {
      console.error("Failed saving uploaded website asset:", updateError);
      return NextResponse.json(
        { error: "Image uploaded, but settings could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl,
      websiteSettings: data.website_settings,
    });
  } catch (error) {
    console.error("Website asset route error:", error);
    return NextResponse.json(
      { error: "Unexpected error uploading website asset." },
      { status: 500 }
    );
  }
}