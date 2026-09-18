import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getInvoice } from "@/lib/queries/invoices";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { PrintButton } from "@/components/app/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { issueInvoice, recordPayment, cancelInvoice } from "../../actions";
import { reviewApproval } from "../../../approvals/actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("invoice", "view");
  const { id } = await params;
  const invoice = await getInvoice(user.tenantId, id);
  if (!invoice) notFound();

  const pendingApproval = await prisma.approval.findFirst({ where: { tenantId: user.tenantId, invoiceId: invoice.id, status: "PENDING" } });
  const dueAmount = invoice.total - invoice.paidAmount;
  const canApprove = can(user.permissions, "approval", "approve");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Invoice {invoice.invoiceNo}</h1>
          <p className="text-sm text-ink-500">{invoice.customer.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.effectiveStatus} />
          <PrintButton />
        </div>
      </div>

      {pendingApproval && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Pending finance approval</p>
          <p className="mt-1 text-sm text-amber-700">{pendingApproval.reason}</p>
          {canApprove && (
            <form action={reviewApproval} className="mt-3 flex gap-2">
              <input type="hidden" name="approvalId" value={pendingApproval.id} />
              <Button type="submit" name="decision" value="APPROVED" size="sm">
                Approve
              </Button>
              <Button type="submit" name="decision" value="REJECTED" size="sm" variant="danger">
                Reject
              </Button>
            </form>
          )}
        </Card>
      )}

      <div className="no-print mb-4 flex gap-2">
        {invoice.status === "DRAFT" && (
          <form action={async () => { "use server"; await issueInvoice(invoice.id); }}>
            <Button type="submit" size="sm">
              Issue Invoice
            </Button>
          </form>
        )}
        {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
          <form action={async () => { "use server"; await cancelInvoice(invoice.id); }}>
            <Button type="submit" size="sm" variant="danger">
              Cancel
            </Button>
          </form>
        )}
      </div>

      <Card>
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-lg font-semibold text-brand-600">LeadFlow</p>
            <p className="text-xs text-ink-400">Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-ink-900">{invoice.invoiceNo}</p>
            <p className="text-ink-400">Issued {formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && <p className="text-ink-400">Due {formatDate(invoice.dueDate)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">Billed To</p>
            <p className="font-medium text-ink-900">{invoice.customer.name}</p>
            <p className="text-ink-500">{[invoice.customer.city, invoice.customer.country].filter(Boolean).join(", ")}</p>
          </div>
          {invoice.opportunity && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-ink-400">Opportunity</p>
              <Link href={`/app/opportunities/${invoice.opportunity.id}`} className="font-medium text-brand-600">
                {invoice.opportunity.opportunityNo}
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
            {invoice.items.map((item) => (
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
          <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          <Row label="Discount" value={`- ${formatCurrency(invoice.discount)}`} />
          <Row label="Tax" value={`+ ${formatCurrency(invoice.tax)}`} />
          <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          <Row label="Paid" value={formatCurrency(invoice.paidAmount)} />
          <Row label="Due" value={formatCurrency(dueAmount)} />
        </div>
      </Card>

      <Card className="no-print mt-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Payments</p>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-ink-400">No payments recorded yet.</p>
        ) : (
          <table className="mb-4 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="py-1.5 font-medium">Date</th>
                <th className="py-1.5 font-medium">Method</th>
                <th className="py-1.5 font-medium">Reference</th>
                <th className="py-1.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-ink-700">{formatDate(p.paymentDate)}</td>
                  <td className="py-2 text-ink-500">{p.method ?? "—"}</td>
                  <td className="py-2 text-ink-500">{p.reference ?? "—"}</td>
                  <td className="py-2 text-right text-ink-800">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {dueAmount > 0 && invoice.status !== "CANCELLED" && invoice.status !== "DRAFT" && (
          <form action={recordPayment} className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Field label="Amount" required>
              <Input type="number" name="amount" required min={1} max={dueAmount} defaultValue={dueAmount} />
            </Field>
            <Field label="Method">
              <Select name="method" defaultValue="Bank Transfer">
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Mobile Banking</option>
                <option>Card</option>
              </Select>
            </Field>
            <Field label="Reference">
              <Input name="reference" placeholder="TXN-..." />
            </Field>
            <div className="flex items-end">
              <SubmitButton size="sm" className="w-full" pendingLabel="Recording...">
                Record Payment
              </SubmitButton>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}
