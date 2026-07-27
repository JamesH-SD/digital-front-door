"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type {
  CampaignStatus,
  CampaignWithCounts,
} from "@/lib/types/campaign";
import type {
  TenantKnowledgeItem,
  TenantKnowledgeSourceType,
} from "@/lib/types/tenant-knowledge";

type Props = {
  tenantSlug: string;
};

type CampaignEntryMode = "none" | "upload" | "manual";

type Confidence = "low" | "medium" | "high";

const DEFAULT_GREETING =
  "Hi! Thanks for checking out this promotion. I’d be happy to answer any questions about it.";

function formatStatus(status: CampaignStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCampaignStatusLabel(status: CampaignStatus) {
  switch (status) {
    case "active":
      return "Live";

    case "ended":
      return "Paused";

    default:
      return "Draft";
  }
}

function getCampaignStatusClasses(status: CampaignStatus) {
  if (status === "active") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "ended") {
    return "border-stone-200 bg-stone-100 text-stone-600";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function CampaignManager({ tenantSlug }: Props) {
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [campaignItems, setCampaignItems] = useState<TenantKnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [campaignQrPreviewUrl, setCampaignQrPreviewUrl] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCampaignLinkCopied, setIsCampaignLinkCopied] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    greetingMessage: DEFAULT_GREETING,
  });

  const [isEditingCampaign, setIsEditingCampaign] = useState(false);

  const [campaignEditForm, setCampaignEditForm] = useState({
    name: "",
    description: "",
    greetingMessage: "",
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    sourceType: "document" as TenantKnowledgeSourceType,
    title: "",
    summary: "",
    notes: "",
    tags: "",
  });

  const [entryMode, setEntryMode] =
    useState<CampaignEntryMode>("none");

  const [manualForm, setManualForm] = useState({
    sourceType: "manual_note" as TenantKnowledgeSourceType,
    title: "",
    content: "",
    tags: "",
    confidence: "medium" as Confidence,
  });

  const selectedCampaign = useMemo(
    () =>
      campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  const campaignPublicUrl = useMemo(() => {
    if (!selectedCampaign) {
      return "";
    }
  
    const path = `/${tenantSlug}/campaign/${selectedCampaign.qrSlug}`;
  
    if (typeof window === "undefined") {
      return path;
    }
  
    return `${window.location.origin}${path}`;
  }, [selectedCampaign, tenantSlug]);

  async function loadCampaigns() {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaigns`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load campaigns.");
      }

      setCampaigns(result.campaigns || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load campaigns."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCampaignItems(campaignId: string) {
    try {
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge?campaignId=${encodeURIComponent(
          campaignId
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load campaign content.");
      }

      setCampaignItems(result.items || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load campaign content."
      );
    }
  }

  async function createCampaign() {
    if (!newCampaign.name.trim()) {
      setMessage("Campaign name is required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaigns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCampaign),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create campaign.");
      }

      const created = result.campaign as CampaignWithCounts;

      setCampaigns((previous) => [
        {
          ...created,
          knowledgeItemCount: 0,
          imageCount: 0,
          documentCount: 0,
        },
        ...previous,
      ]);

      setSelectedCampaignId(created.id);
      setCampaignItems([]);

      setNewCampaign({
        name: "",
        description: "",
        greetingMessage: DEFAULT_GREETING,
      });

      setMessage("Campaign created.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create campaign."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function beginEditingCampaign() {
    if (!selectedCampaign) return;
  
    setCampaignEditForm({
      name: selectedCampaign.name || "",
      description: selectedCampaign.description || "",
      greetingMessage: selectedCampaign.greetingMessage || "",
    });
  
    setIsEditingCampaign(true);
    setMessage("");
  }

  async function saveCampaignDetails() {
    if (!selectedCampaign) {
      setMessage("Select a campaign first.");
      return;
    }
  
    if (!campaignEditForm.name.trim()) {
      setMessage("Campaign name is required.");
      return;
    }
  
    try {
      setIsSaving(true);
      setMessage("");
  
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaigns`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId: selectedCampaign.id,
            name: campaignEditForm.name.trim(),
            description: campaignEditForm.description.trim(),
            greetingMessage: campaignEditForm.greetingMessage.trim(),
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update campaign details."
        );
      }
  
      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                ...result.campaign,
              }
            : campaign
        )
      );
  
      setIsEditingCampaign(false);
      setMessage("Campaign details updated.");
    } catch (error) {
      console.error(error);
  
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update campaign details."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(
    campaignId: string,
    status: CampaignStatus
  ) {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaigns`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update campaign.");
      }

      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === campaignId
            ? {
                ...campaign,
                ...result.campaign,
              }
            : campaign
        )
      );

      setMessage(
        status === "active"
          ? "Campaign is now live."
          : "Campaign has been paused."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update campaign."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function createManualCampaignItem() {
    if (!selectedCampaign) {
      setMessage("Select a campaign first.");
      return;
    }
  
    if (!manualForm.title.trim() || !manualForm.content.trim()) {
      setMessage("Title and content are required.");
      return;
    }
  
    try {
      setIsSaving(true);
      setMessage("");
  
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceType: manualForm.sourceType,
            title: manualForm.title,
            content: manualForm.content,
            tags: parseTags(manualForm.tags),
            confidence: manualForm.confidence,
            sourceLabel: "Campaign Manual Entry",
            knowledgeScope: "campaign",
            campaignId: selectedCampaign.id,
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to add campaign knowledge."
        );
      }
  
      setCampaignItems((previous) => [result.item, ...previous]);
  
      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                knowledgeItemCount:
                  campaign.knowledgeItemCount + 1,
              }
            : campaign
        )
      );
  
      setManualForm({
        sourceType: "manual_note",
        title: "",
        content: "",
        tags: "",
        confidence: "medium",
      });
      
      setEntryMode("none");
      setMessage("Campaign knowledge added.");
    } catch (error) {
      console.error(error);
  
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to add campaign knowledge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadCampaignFile() {
    if (!selectedCampaign) {
      setMessage("Select a campaign first.");
      return;
    }

    if (!uploadForm.file) {
      setMessage("Choose a file to upload.");
      return;
    }

    if (!uploadForm.title.trim() || !uploadForm.summary.trim()) {
      setMessage("Title and summary are required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const formData = new FormData();

      formData.append("file", uploadForm.file);
      formData.append("sourceType", uploadForm.sourceType);
      formData.append("title", uploadForm.title);
      formData.append("summary", uploadForm.summary);
      formData.append("notes", uploadForm.notes);
      formData.append("tags", uploadForm.tags);
      formData.append("knowledgeScope", "campaign");
      formData.append("campaignId", selectedCampaign.id);

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload campaign file.");
      }

      setCampaignItems((previous) => [result.item, ...previous]);

      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                knowledgeItemCount: campaign.knowledgeItemCount + 1,
                imageCount:
                  uploadForm.file?.type.startsWith("image/")
                    ? campaign.imageCount + 1
                    : campaign.imageCount,
                documentCount:
                  uploadForm.file?.type.startsWith("image/")
                    ? campaign.documentCount
                    : campaign.documentCount + 1,
              }
            : campaign
        )
      );

      setUploadForm({
        file: null,
        sourceType: "document",
        title: "",
        summary: "",
        notes: "",
        tags: "",
      });

      setEntryMode("none");
      setMessage("Campaign content uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload campaign content."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copyCampaignLink() {
    if (!campaignPublicUrl) {
      return;
    }
  
    try {
      await navigator.clipboard.writeText(campaignPublicUrl);
      setIsCampaignLinkCopied(true);
  
      window.setTimeout(() => {
        setIsCampaignLinkCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy campaign link:", error);
      setMessage("Could not copy the campaign link.");
    }
  }

  async function downloadCampaignQr() {
    if (!selectedCampaign || !campaignPublicUrl) {
      return;
    }
  
    try {
      setIsGeneratingQr(true);
      setMessage("");
  
      const dataUrl = await QRCode.toDataURL(campaignPublicUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "H",
      });
  
      const safeCampaignName = selectedCampaign.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
  
      const link = document.createElement("a");
  
      link.href = dataUrl;
      link.download = `${safeCampaignName || "campaign"}-qr.png`;
  
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to generate campaign QR code:", error);
      setMessage("Could not generate the campaign QR code.");
    } finally {
      setIsGeneratingQr(false);
    }
  }

  async function deleteCampaignItem(item: TenantKnowledgeItem) {
    const confirmed = window.confirm(
      item.fileUrl
        ? `Delete "${item.title}" and its uploaded file?`
        : `Delete "${item.title}"?`
    );
  
    if (!confirmed) return;
  
    try {
      setIsSaving(true);
      setMessage("");
  
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge?id=${encodeURIComponent(
          item.id
        )}`,
        {
          method: "DELETE",
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete campaign content."
        );
      }
  
      setCampaignItems((previous) =>
        previous.filter((existing) => existing.id !== item.id)
      );
  
      setCampaigns((previous) =>
        previous.map((campaign) => {
          if (campaign.id !== selectedCampaignId) {
            return campaign;
          }
  
          const isImage =
            item.mimeType?.startsWith("image/") ||
            item.sourceType === "photo";
  
          const isDocument =
            item.sourceType === "document" ||
            item.mimeType === "application/pdf" ||
            item.mimeType?.includes("word");
  
          return {
            ...campaign,
            knowledgeItemCount: Math.max(
              0,
              campaign.knowledgeItemCount - 1
            ),
            imageCount: isImage
              ? Math.max(0, campaign.imageCount - 1)
              : campaign.imageCount,
            documentCount: isDocument
              ? Math.max(0, campaign.documentCount - 1)
              : campaign.documentCount,
          };
        })
      );
  
      setMessage("Campaign content deleted.");
    } catch (error) {
      console.error(error);
  
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete campaign content."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCampaign(campaign: CampaignWithCounts) {
    const confirmed = window.confirm(
      `Delete "${campaign.name}" and all documents and images assigned to it? Leads and appointments will not be deleted.`
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/campaigns?campaignId=${encodeURIComponent(
          campaign.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete campaign.");
      }

      setCampaigns((previous) =>
        previous.filter((existing) => existing.id !== campaign.id)
      );

      if (selectedCampaignId === campaign.id) {
        setSelectedCampaignId(null);
        setCampaignItems([]);
      }

      setMessage("Campaign and its content were deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete campaign."
      );
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
  }, [tenantSlug]);

  useEffect(() => {
    if (selectedCampaignId) {
      void loadCampaignItems(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    async function generateCampaignQrPreview() {
      if (!campaignPublicUrl) {
        setCampaignQrPreviewUrl("");
        return;
      }
  
      try {
        const dataUrl = await QRCode.toDataURL(campaignPublicUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });
  
        setCampaignQrPreviewUrl(dataUrl);
      } catch (error) {
        console.error("Failed generating campaign QR preview:", error);
        setCampaignQrPreviewUrl("");
      }
    }
  
    void generateCampaignQrPreview();
  }, [campaignPublicUrl]);

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">
          Create Campaign
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a focused AI receptionist experience for a promotion, offer,
          event, or specific message.
        </p>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Campaign Name
            </span>
            <input
              value={newCampaign.name}
              onChange={(event) =>
                setNewCampaign((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              className="saas-input mt-1 w-full px-3 py-2 text-sm"
              placeholder="Summer Promotion"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Internal Description
            </span>
            <textarea
              value={newCampaign.description}
              onChange={(event) =>
                setNewCampaign((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="saas-input mt-1 w-full px-3 py-2 text-sm"
              placeholder="What this campaign is for"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              AI Greeting
            </span>
            <textarea
              value={newCampaign.greetingMessage}
              onChange={(event) =>
                setNewCampaign((previous) => ({
                  ...previous,
                  greetingMessage: event.target.value,
                }))
              }
              rows={3}
              className="saas-input mt-1 w-full px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={createCampaign}
              disabled={isSaving}
              className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Create Campaign"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Campaigns
          </h2>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-500">
                No campaigns created yet.
              </p>
            ) : (
              campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => {
                    setSelectedCampaignId(campaign.id);
                    setIsEditingCampaign(false);
                    setEntryMode("none");
                    setMessage("");
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedCampaignId === campaign.id
                      ? "border-orange-300 bg-orange-50/50"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">
                        {campaign.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {campaign.knowledgeItemCount} items ·{" "}
                        {campaign.imageCount} images ·{" "}
                        {campaign.documentCount} documents
                      </p>
                    </div>

                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                      {getCampaignStatusLabel(campaign.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {!selectedCampaign ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-gray-500">
              Select a campaign to manage its documents, images, and status.
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-950">
                    {selectedCampaign.name}
                  </h2>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getCampaignStatusClasses(
                        selectedCampaign.status
                      )}`}
                    >
                      {selectedCampaign.status === "active" ? (
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
                      ) : null}

                      {getCampaignStatusLabel(selectedCampaign.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedCampaign.status === "draft" ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(selectedCampaign.id, "active")
                      }
                      disabled={isSaving}
                      className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Publishing..." : "Publish Campaign"}
                    </button>
                  ) : null}

                  {selectedCampaign.status === "active" ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(selectedCampaign.id, "ended")
                      }
                      disabled={isSaving}
                      className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                    >
                      {isSaving ? "Pausing..." : "Pause Campaign"}
                    </button>
                  ) : null}

                  {selectedCampaign.status === "ended" ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(selectedCampaign.id, "active")
                      }
                      disabled={isSaving}
                      className="saas-button-accent px-4 py-2 text-sm font-semibold"
                    >
                      {isSaving ? "Publishing..." : "Republish Campaign"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteCampaign(selectedCampaign)}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-950">
                      Campaign Details
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Information that defines this campaign and its opening AI message.
                    </p>
                  </div>

                  {!isEditingCampaign ? (
                    <button
                      type="button"
                      onClick={beginEditingCampaign}
                      disabled={isSaving}
                      className="saas-button-secondary whitespace-nowrap px-4 py-2 text-sm font-semibold"
                    >
                      Edit Campaign
                    </button>
                  ) : null}
                </div>

                {isEditingCampaign ? (
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Campaign Name
                      </span>

                      <input
                        value={campaignEditForm.name}
                        onChange={(event) =>
                          setCampaignEditForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Internal Description
                      </span>

                      <textarea
                        value={campaignEditForm.description}
                        onChange={(event) =>
                          setCampaignEditForm((previous) => ({
                            ...previous,
                            description: event.target.value,
                          }))
                        }
                        rows={3}
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="Explain the purpose of this campaign."
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        AI Greeting
                      </span>

                      <textarea
                        value={campaignEditForm.greetingMessage}
                        onChange={(event) =>
                          setCampaignEditForm((previous) => ({
                            ...previous,
                            greetingMessage: event.target.value,
                          }))
                        }
                        rows={4}
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="The greeting customers will receive for this campaign."
                      />
                    </label>

                    <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCampaign(false)}
                      disabled={isSaving}
                      className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveCampaignDetails}
                      disabled={isSaving}
                      className="saas-button-accent px-4 py-2 text-sm font-semibold"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Internal Description
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {selectedCampaign.description?.trim() ||
                          "No internal description has been added."}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        AI Greeting
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {selectedCampaign.greetingMessage?.trim() ||
                          "No campaign greeting has been added."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Campaign QR Code
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Customers can scan this code to open this campaign.
                    </p>

                    <div className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-3">
                      <p className="break-all text-xs text-gray-700">
                        {campaignPublicUrl}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!campaignPublicUrl) return;

                          window.open(
                            campaignPublicUrl,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        disabled={!campaignPublicUrl}
                        className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={copyCampaignLink}
                        disabled={!campaignPublicUrl}
                        className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                      >
                        {isCampaignLinkCopied ? "Copied" : "Copy Link"}
                      </button>

                      <button
                        type="button"
                        onClick={downloadCampaignQr}
                        disabled={!campaignPublicUrl || isGeneratingQr}
                        className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGeneratingQr ? "Generating..." : "Download QR"}
                      </button>
                    </div>
                  </div>

                  {campaignQrPreviewUrl ? (
                    <img
                      src={campaignQrPreviewUrl}
                      alt={`${selectedCampaign.name} QR code`}
                      className="h-32 w-32 shrink-0 rounded-xl border border-stone-200 bg-white p-2"
                    />
                  ) : (
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white text-center text-xs text-gray-500">
                      Generating QR...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="border-b border-stone-100 pb-5">
                  <h3 className="font-semibold text-gray-950">
                    Campaign Knowledge
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    Everything added here is available only to this campaign.
                    Upload documents and images, or add information manually for
                    your AI receptionist.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEntryMode((current) =>
                          current === "upload" ? "none" : "upload"
                        )
                      }
                      className={
                        entryMode === "upload"
                          ? "saas-button-primary px-4 py-2 text-sm font-semibold"
                          : "saas-button-secondary px-4 py-2 text-sm font-semibold"
                      }
                    >
                      {entryMode === "upload" ? "Close Upload" : "Upload File"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEntryMode((current) =>
                          current === "manual" ? "none" : "manual"
                        )
                      }
                      className={
                        entryMode === "manual"
                          ? "saas-button-primary px-4 py-2 text-sm font-semibold"
                          : "saas-button-secondary px-4 py-2 text-sm font-semibold"
                      }
                    >
                      {entryMode === "manual"
                        ? "Close Information"
                        : "Add Information"}
                    </button>
                  </div>
                </div>

                {entryMode === "upload" ? (
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        File
                      </span>

                      <input
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                        
                          setUploadForm((previous) => ({
                            ...previous,
                            file,
                            title:
                              previous.title ||
                              (file
                                ? file.name.replace(/\.[^/.]+$/, "")
                                : ""),
                          }));
                        }}
                        className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-gray-600"
                      />

                      {uploadForm.file ? (
                        <p className="mt-2 text-sm text-green-700">
                          ✓ Selected: {uploadForm.file.name}
                        </p>
                      ) : null}
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Title
                        </span>

                        <input
                          value={uploadForm.title}
                          onChange={(event) =>
                            setUploadForm((previous) => ({
                              ...previous,
                              title: event.target.value,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                          placeholder="Campaign flyer, pricing sheet, example photo..."
                        />
                      </label>

                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Type
                        </span>

                        <select
                          value={uploadForm.sourceType}
                          onChange={(event) =>
                            setUploadForm((previous) => ({
                              ...previous,
                              sourceType:
                                event.target.value as TenantKnowledgeSourceType,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        >
                          <option value="document">Document</option>
                          <option value="photo">Photo</option>
                          <option value="faq">FAQ</option>
                          <option value="pricing">Pricing</option>
                          <option value="policy">Policy</option>
                          <option value="service">Service</option>
                          <option value="manual_note">Other</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Summary
                      </span>

                      <textarea
                        value={uploadForm.summary}
                        onChange={(event) =>
                          setUploadForm((previous) => ({
                            ...previous,
                            summary: event.target.value,
                          }))
                        }
                        rows={3}
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="Briefly explain what the AI receptionist should know about this file."
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Additional Notes
                      </span>

                      <textarea
                        value={uploadForm.notes}
                        onChange={(event) =>
                          setUploadForm((previous) => ({
                            ...previous,
                            notes: event.target.value,
                          }))
                        }
                        rows={3}
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="Optional details that may not be included in the uploaded file."
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tags
                      </span>

                      <input
                        value={uploadForm.tags}
                        onChange={(event) =>
                          setUploadForm((previous) => ({
                            ...previous,
                            tags: event.target.value,
                          }))
                        }
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="promotion, summer, service name"
                      />
                    </label>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={uploadCampaignFile}
                        disabled={isSaving}
                        className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Uploading..." : "Upload to Campaign"}
                      </button>
                    </div>
                  </div>
                ) : entryMode === "manual" ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Title
                        </span>

                        <input
                          value={manualForm.title}
                          onChange={(event) =>
                            setManualForm((previous) => ({
                              ...previous,
                              title: event.target.value,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                          placeholder="Summer promotion details"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Type
                        </span>

                        <select
                          value={manualForm.sourceType}
                          onChange={(event) =>
                            setManualForm((previous) => ({
                              ...previous,
                              sourceType:
                                event.target.value as TenantKnowledgeSourceType,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        >
                          <option value="manual_note">General Information</option>
                          <option value="faq">FAQ</option>
                          <option value="service">Service</option>
                          <option value="pricing">Pricing or Offer</option>
                          <option value="policy">Terms or Policy</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Campaign Information
                      </span>

                      <textarea
                        value={manualForm.content}
                        onChange={(event) =>
                          setManualForm((previous) => ({
                            ...previous,
                            content: event.target.value,
                          }))
                        }
                        rows={7}
                        className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        placeholder="Example: This promotion runs through August 31. Customers receive 10% off qualifying services. The promotion cannot be combined with other discounts."
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Tags
                        </span>

                        <input
                          value={manualForm.tags}
                          onChange={(event) =>
                            setManualForm((previous) => ({
                              ...previous,
                              tags: event.target.value,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                          placeholder="promotion, discount, August"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Confidence
                        </span>

                        <select
                          value={manualForm.confidence}
                          onChange={(event) =>
                            setManualForm((previous) => ({
                              ...previous,
                              confidence: event.target.value as Confidence,
                            }))
                          }
                          className="saas-input mt-1 w-full px-3 py-2 text-sm"
                        >
                          <option value="high">High — confirmed information</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low — verify if needed</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={createManualCampaignItem}
                        disabled={isSaving}
                        className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Add to Campaign"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-gray-950">
                  Campaign Content
                </h3>

                <div className="mt-3 space-y-3">
                  {campaignItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-500">
                      This campaign doesn't have any information yet.

                      Upload documents, add photos, or write information for your AI receptionist.
                    </p>
                  ) : (
                    campaignItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-stone-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            {item.fileUrl ? (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-gray-950 transition hover:text-orange-700 hover:underline"
                              >
                                {item.title}
                              </a>
                            ) : (
                              <p className="font-semibold text-gray-950">
                                {item.title}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                              {item.sourceType}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {item.fileUrl ? (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="saas-button-secondary whitespace-nowrap px-3 py-2 text-xs font-semibold"
                              >
                                Open File
                              </a>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => deleteCampaignItem(item)}
                              disabled={isSaving}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete Campaign
                            </button>
                          </div>
                        </div>

                        {(item.summary || item.content) ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                            {item.summary || item.content}
                          </p>
                        ) : null}
                        {item.tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}