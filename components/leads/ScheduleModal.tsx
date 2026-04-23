"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Convert free windows into fixed-duration slots
 */
function buildSlotsFromWindows(windows: any[], slotMinutes = 60) {
  const slots: any[] = [];

  for (const w of windows) {
    const start = new Date(w.startAt);
    const end = new Date(w.endAt);

    let cursor = new Date(start);

    while (cursor.getTime() + slotMinutes * 60000 <= end.getTime()) {
      const slotEnd = new Date(cursor.getTime() + slotMinutes * 60000);

      slots.push({
        startAt: cursor.toISOString(),
        endAt: slotEnd.toISOString(),
        timezone: w.timezone,
      });

      cursor = slotEnd;
    }
  }

  return slots;
}

/**
 * Format date (Mon, Apr 23)
 */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time (10:00 AM)
 */
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ScheduleModal({
  leadId,
  tenantSlug,
  onClose,
}: {
  leadId: string;
  tenantSlug: string;
  onClose: () => void;
}) {
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    setLoading(true);

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30); // 🔥 30-day window

    const params = new URLSearchParams({
      from: now.toISOString(),
      to: future.toISOString(),
      timezone: "America/Los_Angeles",
      minSlotMinutes: "30",
    });

    const res = await fetch(
      `/api/admin/tenants/${tenantSlug}/calendar-connections/google/availability?${params.toString()}`
    );

    const data = await res.json();

    // Convert windows → 60-minute slots
    const built = buildSlotsFromWindows(data.slots || [], 60);

    setSlots(built);

    // Default to first available date
    if (built.length > 0) {
      const firstDate = built[0].startAt.split("T")[0];
      setSelectedDate(firstDate);
    }

    setLoading(false);
  }

  /**
   * Group slots by day
   */
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};

    for (const s of slots) {
      const dateKey = s.startAt.split("T")[0];

      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    }

    return map;
  }, [slots]);

  const dates = Object.keys(grouped);

  async function book() {
    if (!selectedSlot) return;

    await fetch(
      `/api/admin/tenants/${tenantSlug}/appointments/book`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          title: "On-site Estimate",
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          timezone: selectedSlot.timezone,
        }),
      }
    );

    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-5 w-[600px] max-h-[80vh] overflow-hidden">
        <h2 className="text-lg font-semibold">Schedule Appointment</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading availability...</p>
        ) : (
          <div className="mt-4 flex gap-4">
            {/* LEFT: Dates */}
            <div className="w-1/3 border-r pr-2 overflow-y-auto max-h-[400px]">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  className={`block w-full text-left p-2 rounded ${
                    selectedDate === date
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>

            {/* RIGHT: Times */}
            <div className="w-2/3 overflow-y-auto max-h-[400px]">
              {selectedDate &&
                grouped[selectedDate]?.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(slot)}
                    className={`block w-full text-left p-2 border rounded mb-2 ${
                      selectedSlot?.startAt === slot.startAt
                        ? "bg-blue-100"
                        : ""
                    }`}
                  >
                    {formatTime(slot.startAt)} → {formatTime(slot.endAt)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>

          <button
            onClick={book}
            disabled={!selectedSlot}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}