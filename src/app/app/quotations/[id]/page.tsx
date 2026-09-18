import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getQuotation } from "@/lib/queries/quotations";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { PrintButton } from "@/components/app/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { sendQuotation, generateInvoiceFromQuotation } from "../actions";
import { reviewApproval } from "../../approvals/actions";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("quotation", "view");
  const { id } = await params;
  const quotation = await getQuotation(user.tenantId, id);
  if (!quotation) notFound();

  const pendingApproval = await prisma.approval.findFirst({ where: { tenantId: user.tenantId, quotationId: quotation.id, status: "PENDING" } });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Quotation {quotation.quotationNo}</h1>
          <p className="text-sm text-ink-500">{quotation.customer.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={quotation.status} />
          <PrintButton />
        </div>
      </div>

      {pendingApproval && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Pending discount approval</p>
          <p className="mt-1 text-sm text-amber-700">{pendingApproval.reason}</p>
          <form action={reviewApproval} className="mt-3 flex gap-2">
            <input type="hidden" name="approvalId" value={pendingApproval.id} />
            <Button type="submit" name="decision" value="APPROVED" size="sm">
              Approve
            </Button>
            <Button type="submit" name="decision" value="REJECTED" size="sm" variant="danger">
              Reject
            </Button>
          </form>
        </Card>
      )}

      <div className="no-print mb-4 flex gap-2">
        {quotation.status === "DRAFT" && !pendingApproval && (
          <form action={async () => { "use server"; await sendQuotation(quotation.id); }}>
            <Button type="submit" size="sm" variant="secondary">
              Mark as Sent
            </Button>
          </form>
        )}
        {(quotation.status === "SENT" || quotation.status === "APPROVED") && quotation.invoices.length === 0 && (
          <form action={async () => { "use server"; await generateInvoiceFromQuotation(quotation.id); }}>
            <SubmitButton size="sm" pendingLabel="Generating...">
              Generate Invoice
            </SubmitButton>
          </form>
        )}
        {quotation.invoices.map((inv) => (
          <ButtonLink key={inv.id} href={`/app/finance/invoices/${inv.id}`} size="sm" variant="secondary">
            View Invoice {inv.invoiceNo}
          </ButtonLink>
        ))}
      </div>

      <Card>
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-lg font-semibold text-brand-600">LeadFlow</p>
            <p className="text-xs text-ink-400">Quotation</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-ink-900">{quotation.quotationNo}</p>
            <p className="text-ink-400">Revision {quotation.revision}</p>
            {quotation.validUntil && <p className="text-ink-400">Valid until {formatDate(quotation.validUntil)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">Billed To</p>
            <p className="font-medium text-ink-900">{quotation.customer.name}</p>
            <p className="text-ink-500">{[quotation.customer.city, quotation.customer.country].filter(Boolean).join(", ")}</p>
          </div>
          {quotation.opportunity && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-ink-400">Opportunity</p>
              <Link href={`/app/opportunities/${quotation.opportunity.id}`} className="font-medium text-brand-600">
                {quotation.opportunity.opportunityNo}
              </Link>
            </div>
          )}
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-y border-gray-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium">Unit Price</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {quotation.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-ink-800">{item.description}</td>
                <td className="py-2.5 text-ink-500">{item.quantity}</td>
                <td className="py-2.5 text-ink-500">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 text-right text-ink-800">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Discount</span>
            <span>- {formatCurrency(quotation.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Tax</span>
            <span>+ {formatCurrency(quotation.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCurrency(quotation.total)}</span>
          </div>
        </div>

        {quotation.terms && (
          <div className="mt-6 border-t border-gray-100 pt-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-ink-400">Terms &amp; Conditions</p>
            <p className="mt-1 text-ink-600">{quotation.terms}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
