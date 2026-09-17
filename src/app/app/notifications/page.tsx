import Link from "next/link";
import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

export default async function NotificationsPage() {
  const user = await requireTenantSession();
  const notifications = await prisma.notification.findMany({
    where: { tenantId: user.tenantId, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Notifications</h1>
          <p className="text-sm text-ink-500">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
        <form action={markAllNotificationsRead}>
          <Button type="submit" size="sm" variant="secondary">
            Mark all as read
          </Button>
        </form>
      </div>

      <Card className="p-0">
        {notifications.length === 0 ? (
          <EmptyState title="You're all caught up" />
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-4 p-4 ${!n.isRead ? "bg-brand-50/40" : ""}`}>
                <Link href={n.link ?? "#"} className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatDateTime(n.createdAt)}</p>
                </Link>
                {!n.isRead && (
                  <form action={async () => { "use server"; await markNotificationRead(n.id); }}>
                    <Button type="submit" size="sm" variant="ghost">
                      Mark read
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
