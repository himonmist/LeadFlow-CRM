import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listQuotations } from "@/lib/queries/quotations";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function QuotationsPage() {
  const user = await requirePermission("quotation", "view");
  const quotations = await listQuotations(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Quotations</h1>
          <p className="text-sm text-ink-500">{quotations.length} quotations</p>
        </div>
        <ButtonLink href="/app/quotations/new">+ New Quotation</ButtonLink>
      </div>

      <Card className="overflow-x-auto p-0">
        {quotations.length === 0 ? (
          <EmptyState title="No quotations yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Quotation</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Valid Until</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/quotations/${q.id}`} className="font-medium text-brand-600">
                      {q.quotationNo}
                    </Link>
                    <p className="text-xs text-ink-400">Rev {q.revision}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{q.customer.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-400">{q.validUntil ? formatDate(q.validUntil) : "—"}</td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(q.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
