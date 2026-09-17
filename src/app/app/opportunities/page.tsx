import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listOpportunities } from "@/lib/queries/opportunities";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function OpportunitiesPage() {
  const user = await requirePermission("opportunity", "view");
  const opportunities = await listOpportunities(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Opportunities</h1>
        <p className="text-sm text-ink-500">{opportunities.length} opportunities across all customers</p>
      </div>

      <Card className="overflow-x-auto p-0">
        {opportunities.length === 0 ? (
          <EmptyState title="No opportunities yet" description="Convert a lead to create your first opportunity." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Opportunity</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Next Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/opportunities/${o.id}`} className="font-medium text-brand-600">
                      {o.opportunityNo}
                    </Link>
                    <p className="text-xs text-ink-400">{o.requirement}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{o.customer.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={o.engagementType === "TRAINING" ? "info" : "neutral"}>{o.engagementType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.stage.key} />
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(o.estimatedValue)}</td>
                  <td className="px-4 py-3 text-ink-500">{o.owner?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-ink-400">{o.nextFollowUpDate ? formatDate(o.nextFollowUpDate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
