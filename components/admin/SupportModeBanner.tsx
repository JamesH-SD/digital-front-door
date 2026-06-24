"use client";

import { useSearchParams } from "next/navigation";

export default function SupportModeBanner() {
  const searchParams = useSearchParams();
  const supportMode = searchParams.get("supportMode") === "1";

  if (!supportMode) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-900">Support View</p>
          <p className="mt-1 text-sm text-amber-800">
            You are viewing this tenant workspace as a Contactor platform administrator.
          </p>
        </div>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          Read Only
        </span>
      </div>
    </div>
  );
}