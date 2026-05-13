"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/logout/actions";

type Props = {
  email: string;
  role: "owner" | "admin" | "member";
  tenantSlug: string;
};

export default function AdminUserMenu({ email, role, tenantSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
      >
        <span className="hidden max-w-[180px] truncate sm:inline">{email}</span>
        <span aria-hidden="true">👤</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-white p-2 shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {email}
            </p>
            <p className="text-xs capitalize text-gray-500">{role}</p>
          </div>

          <div className="py-2">
            <Link
              href={`/admin/${tenantSlug}/account`}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Account
            </Link>

            <Link
              href={`/admin/${tenantSlug}/settings`}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
          </div>

          <form action={logout} className="border-t pt-2">
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}