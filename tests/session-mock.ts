import { vi } from "vitest";
import type { PermissionMatrix } from "@/lib/permissions";

export type MockSessionUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  roleName: string;
  permissions: PermissionMatrix;
};

export const sessionState: { user: MockSessionUser | null } = { user: null };

export const requirePermission = vi.fn(async () => {
  if (!sessionState.user) throw new Error("session-mock: no user set for this test");
  return sessionState.user;
});

export const requireTenantSession = vi.fn(async () => {
  if (!sessionState.user) throw new Error("session-mock: no user set for this test");
  return sessionState.user;
});
