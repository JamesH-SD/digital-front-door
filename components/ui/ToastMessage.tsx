"use client";

import { useEffect } from "react";

type ToastVariant = "success" | "error";

type ToastMessageProps = {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number;
};

function getToastClasses(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-green-200 bg-green-50 text-green-800";
    case "error":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-gray-200 bg-white text-gray-800";
  }
}

/**
 * Lightweight toast used for section-level save feedback.
 *
 * This is intentionally simple and framework-free so it can be reused
 * across the admin UI without adding another dependency right now.
 */
export default function ToastMessage({
  message,
  variant = "success",
  onClose,
  durationMs = 3000,
}: ToastMessageProps) {
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message, durationMs, onClose]);

  return (
    <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
      <div
        className={`min-w-[260px] max-w-sm rounded-2xl border px-4 py-3 shadow-lg ${getToastClasses(
          variant
        )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{message}</p>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs font-semibold opacity-70 transition hover:opacity-100"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}