import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export default async function AuditLogPage() {
  const user = await requirePermission("settings", "view");
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: user.tenantId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Audit Log</h1>
        <p className="text-sm text-ink-500">Every create, status change, approval, invoice and payment event.</p>
      </div>

      <Card className="overflow-x-auto p-0">
        {logs.length === 0 ? (
          <EmptyState title="No audit entries yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-ink-400">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-700">{log.user?.name ?? "System"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{log.action.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{log.entityType}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">
                    {log.after ? JSON.stringify(log.after) : log.before ? JSON.stringify(log.before) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
