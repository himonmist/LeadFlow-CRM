import { getPlatformOverview } from "@/lib/queries/super-admin";
import { StatCard, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { setTenantStatus } from "./actions";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  SUSPENDED: "danger",
  CANCELLED: "neutral",
};

export default async function SuperAdminDashboard() {
  const { tenants, kpis } = await getPlatformOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Platform Overview</h1>
        <p className="text-sm text-ink-500">Every company running on LeadFlow.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Companies" value={kpis.totalCompanies} />
        <StatCard label="Active Companies" value={kpis.activeCompanies} tone="success" />
        <StatCard label="Trial Companies" value={kpis.trialCompanies} tone="warning" />
        <StatCard label="Total Users" value={kpis.totalUsers} hint={`${kpis.activeUsers} active`} />
        <StatCard label="Platform Revenue Processed" value={formatCurrency(kpis.platformRevenue)} tone="success" />
        <StatCard label="Total Leads" value={kpis.totalLeads} />
        <StatCard label="Total Opportunities" value={kpis.totalOpportunities} />
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-gray-100 p-4">
          <p className="text-sm font-semibold text-ink-900">Tenants</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Leads</th>
              <th className="px-4 py-3 font-medium">Opportunities</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{t.name}</td>
                <td className="px-4 py-3">
                  <Badge tone="info">{t.planTier}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-600">{t._count.users}</td>
                <td className="px-4 py-3 text-ink-600">{t._count.leads}</td>
                <td className="px-4 py-3 text-ink-600">{t._count.opportunities}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-400">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {t.status === "SUSPENDED" ? (
                    <form action={async () => { "use server"; await setTenantStatus(t.id, "ACTIVE"); }}>
                      <Button type="submit" size="sm" variant="secondary">
                        Activate
                      </Button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await setTenantStatus(t.id, "SUSPENDED"); }}>
                      <Button type="submit" size="sm" variant="danger">
                        Suspend
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
