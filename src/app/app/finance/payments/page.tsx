import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listPayments } from "@/lib/queries/invoices";
import { Card, EmptyState, StatCard } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function PaymentsPage() {
  const user = await requirePermission("payment", "view");
  const payments = await listPayments(user.tenantId);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Payments</h1>
        <p className="text-sm text-ink-500">{payments.length} payments recorded</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} tone="success" />
        <StatCard label="Payments Recorded" value={payments.length} />
      </div>

      <Card className="overflow-x-auto p-0">
        {payments.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/finance/invoices/${p.invoiceId}`} className="font-medium text-brand-600">
                      {p.invoice.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{p.invoice.customer.name}</td>
                  <td className="px-4 py-3 text-ink-400">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3 text-ink-500">{p.method ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{p.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
