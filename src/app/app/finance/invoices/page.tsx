import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listInvoices } from "@/lib/queries/invoices";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function InvoicesPage() {
  const user = await requirePermission("invoice", "view");
  const invoices = await listInvoices(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Invoices</h1>
          <p className="text-sm text-ink-500">{invoices.length} invoices</p>
        </div>
        <ButtonLink href="/app/finance/invoices/new">+ New Invoice</ButtonLink>
      </div>

      <Card className="overflow-x-auto p-0">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Generate an invoice from a Won opportunity or quotation." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/finance/invoices/${inv.id}`} className="font-medium text-brand-600">
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{inv.customer.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.effectiveStatus} />
                  </td>
                  <td className="px-4 py-3 text-ink-400">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatCurrency(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatCurrency(inv.total - inv.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
