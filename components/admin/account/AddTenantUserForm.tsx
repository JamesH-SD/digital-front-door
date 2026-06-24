"use client";

import { useState } from "react";

type Props = {
  tenantSlug: string;
};

export default function AddTenantUserForm({ tenantSlug }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function addUser() {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(`/api/admin/tenants/${tenantSlug}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add user.");
      }

      setEmail("");
      setRole("member");
      setMessage("Invite created. Refresh to see pending invites.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add user.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-gray-950">Invite user</p>

      <p className="mt-1 text-sm text-gray-600">
        Invite someone to help manage this business account. Email delivery is coming soon.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px_auto]">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="user@email.com"
          className="saas-input px-3 py-2 text-sm"
        />

        <select
          value={role}
          onChange={(event) => setRole(event.target.value as "admin" | "member")}
          className="h-11 rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="button"
          onClick={() => void addUser()}
          disabled={isSaving || !email.trim()}
          className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {isSaving ? "Inviting..." : "Invite User"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-gray-600">{message}</p> : null}
    </div>
  );
}