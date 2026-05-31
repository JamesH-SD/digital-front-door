"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/logout/actions";

type Props = {
  email: string;
  role: "owner" | "admin" | "member";
  tenantSlug: string;
};

export default function AdminUserMenu({ email, role, tenantSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-stone-50"
      >
        <span className="hidden max-w-[180px] truncate sm:inline">{email}</span>
        <span aria-hidden="true">👤</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <div className="border-b border-stone-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {email}
            </p>
            <p className="text-xs capitalize text-gray-500">{role}</p>
          </div>

          <div className="space-y-1 py-2">
            <Link
              href={`/admin/${tenantSlug}/account`}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-stone-50"
              onClick={() => setIsOpen(false)}
            >
              Account
            </Link>

            <Link
              href={`/admin/${tenantSlug}/settings`}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-stone-50"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
          </div>

          <form action={logout} className="border-t border-stone-100 pt-2">
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}