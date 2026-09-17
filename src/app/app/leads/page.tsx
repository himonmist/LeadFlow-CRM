import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listLeads, listOwners } from "@/lib/queries/leads";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SelectFilter } from "@/components/app/table-filters";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; owner?: string }> }) {
  const user = await requirePermission("lead", "view");
  const params = await searchParams;
  const [leads, owners] = await Promise.all([
    listLeads(user.tenantId, { status: params.status, ownerId: params.owner }),
    listOwners(user.tenantId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Leads</h1>
          <p className="text-sm text-ink-500">{leads.length} leads · every lead has an owner and a source.</p>
        </div>
        <ButtonLink href="/app/leads/new">+ New Lead</ButtonLink>
      </div>

      <div className="flex flex-wrap gap-3">
        <SelectFilter
          name="status"
          placeholder="All statuses"
          options={["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"].map((s) => ({ value: s, label: s }))}
        />
        <SelectFilter name="owner" placeholder="All owners" options={owners.map((o) => ({ value: o.id, label: o.name }))} />
      </div>

      <Card className="overflow-x-auto p-0">
        {leads.length === 0 ? (
          <EmptyState title="No leads yet" description="Create your first lead to start the pipeline." action={<ButtonLink href="/app/leads/new" size="sm" className="mt-2">+ New Lead</ButtonLink>} />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/leads/${lead.id}`} className="font-medium text-brand-600">
                      {lead.leadNumber}
                    </Link>
                    {lead.opportunities.length > 0 && (
                      <Badge tone="info" className="ml-2">
                        {lead.opportunities.length} opp{lead.opportunities.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-800">{lead.companyName}</td>
                  <td className="px-4 py-3 text-ink-500">{lead.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-ink-500">{lead.businessInterest.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-500">{lead.owner?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-ink-700">{lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"}</td>
                  <td className="px-4 py-3 text-ink-400">{formatDate(lead.leadDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
