"use client";

import { useEffect } from "react";
import {
  BreadcrumbItem,
  useAdminBreadcrumbs,
} from "@/components/admin/AdminBreadcrumbsContext";

type Props = {
  items: BreadcrumbItem[];
};

export default function AdminBreadcrumbsSetter({ items }: Props) {
  const { setBreadcrumbs } = useAdminBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs(items);

    return () => {
      setBreadcrumbs(null);
    };
  }, [items, setBreadcrumbs]);

  return null;
}