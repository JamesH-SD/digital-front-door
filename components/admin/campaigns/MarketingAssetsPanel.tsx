"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { CampaignAsset } from "@/lib/types/campaign-asset";
import { formatLeadSource } from "@/lib/utils/leadSource";

type Props = {
  tenantSlug: string;
  campaignId: string;
  campaignName: string;
  campaignQrSlug: string;
};

const SOURCE_OPTIONS = [
  { value: "business_card", label: "Business Card" },
  { value: "vehicle", label: "Vehicle" },
  { value: "yard_sign", label: "Yard Sign" },
  { value: "flyer", label: "Flyer" },
  { value: "door_hanger", label: "Door Hanger" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google_business", label: "Google Business" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "custom", label: "Custom" },
];

export default function MarketingAssetsPanel({
  tenantSlug,
  campaignId,
  campaignName,
  campaignQrSlug,
}: Props) {
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [selectedAsset, setSelectedAsset] =
    useState<CampaignAsset | null>(null);

  const [name, setName] = useState("");
  const [source, setSource] = useState("business_card");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  const selectedAssetUrl = useMemo(() => {
    if (!selectedAsset) {
      return "";
    }

    const path = `/${tenantSlug}/campaign/${campaignQrSlug}/${selectedAsset.slug}`;

    if (typeof window === "undefined") {
      return path;
    }

    return `${window.location.origin}${path}`;
  }, [campaignQrSlug, selectedAsset, tenantSlug]);

  async function loadAssets() {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaign-assets?campaignId=${encodeURIComponent(
          campaignId
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load marketing assets.");
      }

      setAssets(result.assets || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load marketing assets."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function createAsset() {
    if (!name.trim()) {
      setMessage("Asset name is required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaign-assets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId,
            name: name.trim(),
            source,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create marketing asset.");
      }

      const createdAsset = result.asset as CampaignAsset;

      setAssets((previous) => [createdAsset, ...previous]);
      setSelectedAsset(createdAsset);
      setName("");
      setSource("business_card");
      setMessage("Marketing asset created.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create marketing asset."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateAssetStatus(
    asset: CampaignAsset,
    isActive: boolean
  ) {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaign-assets`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignAssetId: asset.id,
            isActive,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update marketing asset.");
      }

      setAssets((previous) =>
        previous.map((existing) =>
          existing.id === asset.id ? result.asset : existing
        )
      );

      setSelectedAsset((current) =>
        current?.id === asset.id ? result.asset : current
      );

      setMessage(isActive ? "Marketing asset activated." : "Marketing asset paused.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update marketing asset."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAsset(asset: CampaignAsset) {
    const confirmed = window.confirm(
      `Delete "${asset.name}"? Printed QR codes using this asset will stop working.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaign-assets?campaignAssetId=${encodeURIComponent(
          asset.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete marketing asset.");
      }

      setAssets((previous) =>
        previous.filter((existing) => existing.id !== asset.id)
      );

      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }

      setMessage("Marketing asset deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete marketing asset."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function buildAssetUrl(asset: CampaignAsset) {
    const path = `/${tenantSlug}/campaign/${campaignQrSlug}/${asset.slug}`;

    if (typeof window === "undefined") {
      return path;
    }

    return `${window.location.origin}${path}`;
  }

  async function copyAssetLink(asset: CampaignAsset) {
    try {
      await navigator.clipboard.writeText(buildAssetUrl(asset));
      setCopiedAssetId(asset.id);

      window.setTimeout(() => {
        setCopiedAssetId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy asset link:", error);
      setMessage("Could not copy the marketing asset link.");
    }
  }

  async function downloadAssetQr(asset: CampaignAsset) {
    try {
      setIsSaving(true);
      setMessage("");

      const url = buildAssetUrl(asset);

      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      const safeAssetName = asset.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const link = document.createElement("a");

      link.href = dataUrl;
      link.download = `${safeAssetName || "campaign-asset"}-qr.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to generate asset QR code:", error);
      setMessage("Could not generate the marketing asset QR code.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, [campaignId, tenantSlug]);

  useEffect(() => {
    async function createPreview() {
      if (!selectedAssetUrl) {
        setQrPreviewUrl("");
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(selectedAssetUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        setQrPreviewUrl(dataUrl);
      } catch (error) {
        console.error("Failed to generate asset QR preview:", error);
        setQrPreviewUrl("");
      }
    }

    void createPreview();
  }, [selectedAssetUrl]);

  return (
    <section>
      {message ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Asset Name
          </span>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="saas-input mt-1 w-full px-3 py-2 text-sm"
            placeholder="Summer Campaign Business Card"
          />
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Source
          </span>

          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="saas-input mt-1 w-full px-3 py-2 text-sm"
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={createAsset}
            disabled={isSaving}
            className="saas-button-accent w-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Create Asset"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading marketing assets...</p>
        ) : assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-500">
            No marketing assets have been created for this campaign.
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className="min-w-0 text-left"
                  >
                    <p className="font-semibold text-gray-950">
                      {asset.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatLeadSource(asset.source)} ·{" "}
                      {asset.isActive ? "Active" : "Paused"}
                    </p>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          buildAssetUrl(asset),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => copyAssetLink(asset)}
                      className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                    >
                      {copiedAssetId === asset.id ? "Copied" : "Copy Link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadAssetQr(asset)}
                      disabled={isSaving}
                      className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                    >
                      Download QR
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAssetStatus(asset, !asset.isActive)
                      }
                      disabled={isSaving}
                      className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                    >
                      {asset.isActive ? "Pause" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAsset(asset)}
                      disabled={isSaving}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-950">
                  {selectedAsset.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {campaignName} · {formatLeadSource(selectedAsset.source)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="saas-button-secondary px-3 py-2 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row">
              {qrPreviewUrl ? (
                <img
                  src={qrPreviewUrl}
                  alt={`${selectedAsset.name} QR code`}
                  className="h-40 w-40 shrink-0 rounded-xl border border-stone-200 bg-white p-2"
                />
              ) : (
                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-300 text-xs text-gray-500">
                  Generating QR...
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Destination URL
                </p>

                <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <p className="break-all text-xs leading-5 text-gray-700">
                    {selectedAssetUrl}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        selectedAssetUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="saas-button-secondary px-3 py-2 text-sm font-semibold"
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => copyAssetLink(selectedAsset)}
                    className="saas-button-secondary px-3 py-2 text-sm font-semibold"
                  >
                    {copiedAssetId === selectedAsset.id
                      ? "Copied"
                      : "Copy Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadAssetQr(selectedAsset)}
                    disabled={isSaving}
                    className="saas-button-accent px-3 py-2 text-sm font-semibold"
                  >
                    Download QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}