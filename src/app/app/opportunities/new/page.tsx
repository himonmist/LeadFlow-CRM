import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { createOpportunity } from "../actions";

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<{ customerId?: string; leadId?: string }> }) {
  const user = await requirePermission("opportunity", "create");
  const { customerId, leadId } = await searchParams;
  if (!customerId) notFound();

  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: user.tenantId } });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-900">New Opportunity</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add another service or training program for <span className="font-medium text-ink-700">{customer.name}</span>. It gets its
        own pipeline stage, follow-ups, and Won/Lost outcome — separate from any opportunities the customer already has.
      </p>

      <Card className="mt-6">
        <form action={createOpportunity} className="grid gap-4">
          <input type="hidden" name="customerId" value={customer.id} />
          {leadId && <input type="hidden" name="leadId" value={leadId} />}

          <Field label="Requirement" required>
            <Textarea name="requirement" required placeholder="What does the customer need?" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Engagement Type" required>
              <Select name="engagementType" required defaultValue="SERVICE">
                <option value="SERVICE">Service</option>
                <option value="TRAINING">Training</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </Field>
          </div>
          <Field label="Program / Service Name">
            <Input name="programName" placeholder="e.g. AI Training for Oncology Doctors" />
          </Field>
          <Field label="Estimated Value (BDT)" required>
            <Input type="number" name="estimatedValue" required min={0} step={1000} defaultValue={0} />
          </Field>

          <SubmitButton size="lg" className="w-fit" pendingLabel="Creating...">
            Create Opportunity
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
