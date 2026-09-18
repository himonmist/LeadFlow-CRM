import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/permissions";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenantSession();

  const unreadCount = await prisma.notification.count({
    where: { tenantId: user.tenantId, userId: user.id, isRead: false },
  });

  return (
    <AppShell
      permissions={user.permissions}
      tenantName={user.tenantName ?? "Workspace"}
      userName={user.name ?? "User"}
      roleLabel={ROLE_LABELS[user.roleName] ?? user.roleName}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
