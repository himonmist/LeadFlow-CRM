import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/permissions";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenantSession();

  const unreadCount = await prisma.notification.count({
    where: { tenantId: user.tenantId, userId: user.id, isRead: false },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar permissions={user.permissions} tenantName={user.tenantName ?? "Workspace"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={user.name ?? "User"} roleLabel={ROLE_LABELS[user.roleName] ?? user.roleName} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
