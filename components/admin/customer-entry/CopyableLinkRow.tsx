"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  label: string;
  description: string;
  value: string;
  disabledMessage?: string;
  fileName: string;
  copyButtonLabel?: string;
};

export default function CopyableLinkRow({
  label,
  description,
  value,
  disabledMessage,
  fileName,
  copyButtonLabel = "Copy",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");

  async function handleCopy() {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  async function handleDownloadQr() {
    if (!value) return;

    try {
      setIsGeneratingQr(true);

      const dataUrl = await QRCode.toDataURL(value, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Could not generate QR code. Please try again.");
    } finally {
      setIsGeneratingQr(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function generatePreview() {
      if (!value) {
        setQrPreviewUrl("");
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        if (isMounted) {
          setQrPreviewUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed generating QR preview:", error);
      }
    }

    void generatePreview();

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>

        {qrPreviewUrl ? (
          <img
            src={qrPreviewUrl}
            alt={`${label} QR`}
            className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 bg-white p-1"
          />
        ) : null}
      </div>

      <div className="mt-4 flex min-h-[56px] min-w-0 items-center rounded-xl border border-stone-200 bg-gray-50 px-3 py-2">
        <p className="line-clamp-2 break-all text-xs text-gray-700">
          {value || disabledMessage || "Not available"}
        </p>
      </div>

      <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            if (!value) return;
            window.open(value, "_blank", "noopener,noreferrer");
          }}
          disabled={!value}
          className="saas-button-secondary w-full min-w-0 px-3 py-2 text-xs font-semibold"
        >
          Open
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="saas-button-secondary w-full min-w-0 px-3 py-2 text-xs font-semibold"
        >
          {copied ? "Copied" : copyButtonLabel}
        </button>

        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!value || isGeneratingQr}
          className="saas-button-secondary w-full min-w-0 px-3 py-2 text-xs font-semibold"
        >
          {isGeneratingQr ? "Generating..." : "Download QR"}
        </button>
      </div>
    </div>
  );
}
