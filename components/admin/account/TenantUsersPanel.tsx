"use client";

import { useState } from "react";
import type { TenantUser } from "@/lib/db/tenant-users";
import AddTenantUserForm from "@/components/admin/account/AddTenantUserForm";
import type { TenantInvite } from "@/lib/db/tenant-invites";

type Props = {
  tenantSlug: string;
  currentUserRole: "owner" | "admin" | "member";
  users: TenantUser[];
  invites: TenantInvite[];
};

export default function TenantUsersPanel({
  tenantSlug,
  currentUserRole,
  users,
  invites,
}: Props) {
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const canEditRoles = currentUserRole === "owner";

  async function updateRole(userId: string, role: string) {
    try {
      setSavingUserId(userId);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/users/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role.");
      }

      setMessage("User role updated. Refresh to confirm.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function removeUser(userId: string) {
    const confirmed = window.confirm(
      "Remove this user from the business account?"
    );

    if (!confirmed) return;

    try {
      setSavingUserId(userId);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove user.");
      }

      setMessage("User removed. Refresh to confirm.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove user.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      {canEditRoles ? <AddTenantUserForm tenantSlug={tenantSlug} /> : null}

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-950">
                {user.email}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Account user
              </p>
            </div>

            {canEditRoles ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  defaultValue={user.role}
                  disabled={savingUserId === user.userId}
                  onChange={(event) =>
                    void updateRole(user.userId, event.target.value)
                  }
                  className="h-11 min-w-[130px] rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>

                <button
                  type="button"
                  onClick={() => void removeUser(user.userId)}
                  disabled={savingUserId === user.userId}
                  className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                {user.role}
              </span>
            )}
          </div>
        ))}
      </div>

      {invites.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-950">Pending invites</p>

          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  {invite.email}
                </p>
                <p className="mt-1 text-xs capitalize text-amber-800">
                  {invite.role} invite pending
                </p>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                Pending
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="text-sm text-gray-600">{message}</p> : null}

      <p className="text-sm text-gray-500">
        User invitations are coming soon.
      </p>
    </div>
  );
}