"use client";

import { useEffect, useState } from "react";

type Props = {
  tenantSlug: string;
};

type CalendarConnection = {
  id: string;
  externalAccountEmail?: string | null;
  calendarName?: string | null;
};

export default function CalendarConnectionStatus({ tenantSlug }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/tenants/${tenantSlug}/calendar-connections`
        );

        const data = await res.json();

        if (res.ok && data.primaryConnection) {
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    }

    load();
  }, [tenantSlug]);

  if (connected === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status Dot */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-gray-600">
          {connected ? "Calendar Connected" : "Calendar Disconnected"}
        </span>
      </div>

      {/* Reconnect Link */}
      {!connected && (
        <button
          onClick={() => {
            window.location.href = `/api/admin/tenants/${tenantSlug}/calendar-connections/google/start`;
          }}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}