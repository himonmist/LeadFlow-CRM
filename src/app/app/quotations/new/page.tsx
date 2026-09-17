import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { LineItemsEditor } from "@/components/app/line-items-editor";
import { createQuotation } from "../actions";

export default async function NewQuotationPage({ searchParams }: { searchParams: Promise<{ opportunityId?: string }> }) {
  const user = await requirePermission("quotation", "create");
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
      <h1 className="text-2xl font-semibold text-ink-900">New Quotation</h1>
      <p className="mt-1 text-sm text-ink-500">Generate a quotation directly for a customer or from an opportunity.</p>

      <form action={createQuotation} className="card mt-6 grid gap-5 p-6">
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
          <Field label="Valid Until">
            <Input type="date" name="validUntil" />
          </Field>
        </div>
        <Field label="Terms &amp; Conditions">
          <Textarea name="terms" placeholder="e.g. 50% advance, balance on completion. Valid for 30 days." />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>

        <Button type="submit" size="lg" className="w-fit">
          Create Quotation
        </Button>
      </form>
    </div>
  );
}
