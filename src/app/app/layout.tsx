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
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
      <div className="no-print contents">
        <Sidebar permissions={user.permissions} tenantName={user.tenantName ?? "Workspace"} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="no-print contents">
          <Topbar userName={user.name ?? "User"} roleLabel={ROLE_LABELS[user.roleName] ?? user.roleName} unreadCount={unreadCount} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  );
}
