export type TenantRole = "owner" | "admin" | "member";

export type TenantMembership = {
  id: string;
  tenantSlug: string;
  userId: string;
  role: TenantRole;
  createdAt: string;
  updatedAt?: string;
};