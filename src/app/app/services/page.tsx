import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listServices } from "@/lib/queries/services";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ServicesPage() {
  const user = await requirePermission("service", "view");
  const services = await listServices(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Services</h1>
        <p className="text-sm text-ink-500">{services.length} service engagements</p>
      </div>

      <Card className="overflow-x-auto p-0">
        {services.length === 0 ? (
          <EmptyState title="No services yet" description="Services are created automatically when a Service-type opportunity is marked Won." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Project Manager</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expected Delivery</th>
                <th className="px-4 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/services/${s.id}`} className="font-medium text-brand-600">
                      {s.name}
                    </Link>
                    <p className="text-xs text-ink-400">{s.category ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{s.customer.name}</td>
                  <td className="px-4 py-3 text-ink-500">{s.projectManager?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-400">{s.expectedDeliveryDate ? formatDate(s.expectedDeliveryDate) : "—"}</td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
