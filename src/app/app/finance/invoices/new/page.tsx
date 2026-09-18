import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { LineItemsEditor } from "@/components/app/line-items-editor";
import { createInvoice } from "../../actions";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ opportunityId?: string }> }) {
  const user = await requirePermission("invoice", "create");
  const { opportunityId } = await searchParams;

  const [customers, opportunity] = await Promise.all([
    prisma.customer.findMany({ where: { tenantId: user.tenantId, deletedAt: null }, orderBy: { name: "asc" } }),
    opportunityId ? prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: user.tenantId } }) : null,
  ]);

  const initialItems = opportunity
    ? [{ description: opportunity.programName ?? opportunity.requirement, quantity: 1, unitPrice: opportunity.estimatedValue }]
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-ink-900">New Invoice</h1>
      <p className="mt-1 text-sm text-ink-500">Generate an invoice for a customer.</p>

      <form action={createInvoice} className="card mt-6 grid gap-5 p-6">
        {opportunity && <input type="hidden" name="opportunityId" value={opportunity.id} />}
        <Field label="Customer" required>
          <Select name="customerId" required defaultValue={opportunity?.customerId ?? ""}>
            <option value="" disabled>
              Select customer
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <LineItemsEditor initialItems={initialItems} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due Date">
            <Input type="date" name="dueDate" />
          </Field>
          <Field label="Payment Terms">
            <Input name="paymentTerms" placeholder="e.g. Net 15" />
          </Field>
        </div>

        <SubmitButton size="lg" className="w-fit" pendingLabel="Creating...">
          Create Invoice
        </SubmitButton>
      </form>
    </div>
  );
}
