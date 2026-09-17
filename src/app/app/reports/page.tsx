import { requirePermission } from "@/lib/session";
import { getReportsData } from "@/lib/queries/reports";
import { Card, StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function ReportsPage() {
  const user = await requirePermission("report", "view");
  const data = await getReportsData(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Reports</h1>
          <p className="text-sm text-ink-500">Lead, sales, service, training and finance performance.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/reports/export?type=leads" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
            Export Leads CSV
          </a>
          <a href="/api/reports/export?type=invoices" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
            Export Invoices CSV
          </a>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Lead Reports</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Conversion Rate" value={`${data.conversionRate}%`} tone="success" />
          <Card>
            <p className="mb-2 text-sm font-semibold text-ink-900">Leads by Source</p>
            <TableList rows={data.leadsBySource.map((l) => [l.source.replace(/_/g, " "), l._count])} />
          </Card>
          <Card>
            <p className="mb-2 text-sm font-semibold text-ink-900">Leads by Status</p>
            <TableList rows={data.leadsByStatus.map((l) => [l.status, l._count])} />
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Sales Reports</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Pipeline Value" value={formatCurrency(data.pipelineValue)} />
          <StatCard label="Won Revenue" value={formatCurrency(data.wonValue)} tone="success" />
          <StatCard label="Lost Value" value={formatCurrency(data.lostValue)} tone="danger" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Service Reports</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Services Delivered" value={data.servicesDelivered} tone="success" />
          <StatCard label="Upcoming Services" value={data.upcomingServices} />
          <StatCard label="Delayed Services" value={data.delayedServices} tone="danger" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Training Reports</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-3">
            <StatCard label="Total Programs" value={data.trainingCount} />
            <StatCard label="Participants" value={data.trainingParticipants} />
            <StatCard label="Training Revenue" value={formatCurrency(data.trainingRevenue)} tone="success" />
            <StatCard label="Upcoming" value={data.upcomingTraining} />
            <StatCard label="Completed" value={data.completedTraining} tone="success" />
          </div>
          <Card>
            <p className="mb-2 text-sm font-semibold text-ink-900">Trainer Utilization</p>
            <TableList rows={data.trainerUtilization.map((t) => [t.name, t.count])} />
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Finance Reports</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Invoiced" value={formatCurrency(data.totalInvoiced)} />
          <StatCard label="Total Paid" value={formatCurrency(data.totalPaid)} tone="success" />
          <StatCard label="Outstanding" value={formatCurrency(data.outstanding)} tone="warning" />
          <StatCard label="Overdue" value={formatCurrency(data.overdue)} tone="danger" />
        </div>
      </section>
    </div>
  );
}

function TableList({ rows }: { rows: [string, number][] }) {
  if (rows.length === 0) return <p className="text-sm text-ink-400">No data yet.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center justify-between">
          <span className="text-ink-600">{label}</span>
          <span className="font-medium text-ink-900">{value}</span>
        </li>
      ))}
    </ul>
  );
}
