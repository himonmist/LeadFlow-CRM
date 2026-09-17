import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, type Action, type Entity } from "@/lib/permissions";

/**
 * Every tenant-scoped data call must go through this so a compromised or
 * buggy query can never leak across tenants: it hands back the tenantId to
 * filter on, never lets a caller omit it.
 */
export async function requireTenantSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.tenantId) redirect("/super-admin");
  return session.user as typeof session.user & { tenantId: string };
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleName !== "SUPER_ADMIN") redirect("/app/dashboard");
  return session.user;
}

export async function requirePermission(entity: Entity, action: Action) {
  const user = await requireTenantSession();
  if (!can(user.permissions, entity, action)) {
    redirect("/app/dashboard?denied=1");
  }
  return user;
}
