import { requireTenantSession } from "@/lib/session";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard, Card, EmptyState } from "@/components/ui/card";
import { LineTrendCard, BarTrendCard } from "@/components/app/charts";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireTenantSession();
  const data = await getDashboardData(user.tenantId);

  const kpis = [
    ["Total Leads", data.kpis.totalLeads],
    ["New Leads", data.kpis.newLeads],
    ["Qualified Leads", data.kpis.qualifiedLeads],
    ["Follow-ups Today", data.kpis.followUpsToday],
    ["Overdue Follow-ups", data.kpis.overdueFollowUps, data.kpis.overdueFollowUps > 0 ? "danger" : "neutral"],
    ["Open Opportunities", data.kpis.openOpportunities],
    ["Won Deals", data.kpis.wonDeals, "success"],
    ["Lost Deals", data.kpis.lostDeals],
    ["Upcoming Services", data.kpis.upcomingServices],
    ["Upcoming Training", data.kpis.upcomingTraining],
    ["Pending Invoices", data.kpis.pendingInvoices, "warning"],
    ["Revenue Collected", formatCurrency(data.kpis.revenue), "success"],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Welcome back, {user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-ink-500">Here&rsquo;s what&rsquo;s happening across {user.tenantName} today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, tone]) => (
          <StatCard key={label as string} label={label as string} value={value as string | number} tone={tone as any} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineTrendCard title="Lead Acquisition Trend (8 weeks)" data={data.leadTrend} dataKey="count" />
        <BarTrendCard title="Sales Pipeline by Stage (value)" data={data.pipelineByStage} xKey="stage" dataKey="value" color="#f59e0b" valueFormat="currency" />
        <BarTrendCard title="Revenue Trend (6 months)" data={data.revenueTrend} xKey="label" dataKey="revenue" color="#10b981" valueFormat="currency" />
        <BarTrendCard title="Lead Source Performance" data={data.leadsBySource} xKey="source" dataKey="count" color="#6366f1" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Today&rsquo;s Actions</p>
            <Link href="/app/calendar" className="text-xs font-medium text-brand-600">
              View calendar
            </Link>
          </div>
          {data.todaysActivities.length === 0 ? (
            <EmptyState title="Nothing scheduled today" description="Follow-ups, meetings and deliveries scheduled for today will show up here." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.todaysActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">
                      {a.startTime ?? "--:--"} · {a.customer?.name ?? a.lead?.companyName ?? "—"}
                    </p>
                    <p className="text-xs text-ink-400">{a.type.replace(/_/g, " ")} · {a.subject}</p>
                  </div>
                  <span className="text-xs text-ink-500">{a.assignedTo?.name ?? "Unassigned"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <p className="mb-4 text-sm font-semibold text-ink-900">Revenue by Engagement Type</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-ink-700">Service</span>
              <span className="text-sm font-semibold text-ink-900">{formatCurrency(data.engagementRevenue.service)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-ink-700">Training</span>
              <span className="text-sm font-semibold text-ink-900">{formatCurrency(data.engagementRevenue.training)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-4 text-sm font-semibold text-ink-900">Team Performance</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Leads</th>
                <th className="pb-2 font-medium">Follow-ups</th>
                <th className="pb-2 font-medium">Won</th>
                <th className="pb-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.employeePerformance.map((e) => (
                <tr key={e.name}>
                  <td className="py-2.5 font-medium text-ink-900">{e.name}</td>
                  <td className="py-2.5 text-ink-600">{e.leads}</td>
                  <td className="py-2.5 text-ink-600">{e.followUps}</td>
                  <td className="py-2.5 text-ink-600">{e.won}</td>
                  <td className="py-2.5 text-ink-600">{formatCurrency(e.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
