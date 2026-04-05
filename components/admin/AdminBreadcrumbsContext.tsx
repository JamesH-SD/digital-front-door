"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbsContextValue = {
  breadcrumbs: BreadcrumbItem[] | null;
  setBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
};

const AdminBreadcrumbsContext =
  createContext<AdminBreadcrumbsContextValue | null>(null);

export function AdminBreadcrumbsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  const value = useMemo(
    () => ({
      breadcrumbs,
      setBreadcrumbs,
    }),
    [breadcrumbs]
  );

  return (
    <AdminBreadcrumbsContext.Provider value={value}>
      {children}
    </AdminBreadcrumbsContext.Provider>
  );
}

export function useAdminBreadcrumbs() {
  const context = useContext(AdminBreadcrumbsContext);

  if (!context) {
    throw new Error(
      "useAdminBreadcrumbs must be used within AdminBreadcrumbsProvider"
    );
  }

  return context;
}