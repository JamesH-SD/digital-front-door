"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  tenantSlug: string;
  compact?: boolean;
};

export default function CalendarConnectionStatus({
  tenantSlug,
  compact = false,
}: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/tenants/${tenantSlug}/calendar-connections`
        );

        const data = await res.json();
        setConnected(Boolean(res.ok && data.primaryConnection));
      } catch {
        setConnected(false);
      }
    }

    void load();
  }, [tenantSlug]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
  
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function connectCalendar() {
    window.location.href = `/api/admin/tenants/${tenantSlug}/calendar-connections/google/start`;
  }

  if (connected === null) {
    return null;
  }

  const label = connected ? "Calendar Connected" : "Calendar Disconnected";

  if (compact) {
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition hover:bg-stone-50"
          aria-label={label}
          title={label}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </button>

        {isOpen ? (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-3 text-sm shadow-xl">
            <p className="font-semibold text-gray-900">{label}</p>

            <button
              type="button"
              onClick={connectCalendar}
              className="mt-3 w-full rounded-xl bg-orange-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-800"
            >
              {connected ? "Reconnect Calendar" : "Connect Calendar"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-sm text-gray-600 transition hover:border-stone-200 hover:bg-gray-50"
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>{label}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 z-50 mt-2 w-60 rounded-2xl border border-stone-200 bg-white p-3 text-sm shadow-xl">
          <p className="font-semibold text-gray-900">{label}</p>

          <button
            type="button"
            onClick={connectCalendar}
            className="mt-3 w-full rounded-xl bg-orange-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-800"
          >
            {connected ? "Reconnect Calendar" : "Connect Calendar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}