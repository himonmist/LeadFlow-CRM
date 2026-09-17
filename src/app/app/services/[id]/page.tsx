import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getService } from "@/lib/queries/services";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateService } from "../actions";

const STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "PARTIALLY_DELIVERED", "COMPLETED", "CANCELLED", "POSTPONED"];

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("service", "view");
  const { id } = await params;
  const service = await getService(user.tenantId, id);
  if (!service) notFound();

  const total = service.value - service.discount + service.tax;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink-900">{service.name}</h1>
          <StatusBadge status={service.status} />
        </div>
        <p className="text-sm text-ink-500">
          <Link href={`/app/customers/${service.customer.id}`} className="text-brand-600">
            {service.customer.name}
          </Link>{" "}
          · <Link href={`/app/opportunities/${service.opportunityId}`} className="text-brand-600">Opportunity</Link>
        </p>

        {service.description && (
          <Card>
            <p className="text-sm text-ink-600">{service.description}</p>
          </Card>
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Delivery Details</p>
          <form action={updateService} className="grid gap-4">
            <input type="hidden" name="serviceId" value={service.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status">
                <Select name="status" defaultValue={service.status}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category">
                <Input name="category" defaultValue={service.category ?? ""} />
              </Field>
              <Field label="Assigned Team">
                <Input name="assignedTeam" defaultValue={service.assignedTeam ?? ""} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start Date">
                <Input type="date" name="startDate" defaultValue={toDateInput(service.startDate)} />
              </Field>
              <Field label="Expected Delivery">
                <Input type="date" name="expectedDeliveryDate" defaultValue={toDateInput(service.expectedDeliveryDate)} />
              </Field>
              <Field label="Actual Delivery">
                <Input type="date" name="actualDeliveryDate" defaultValue={toDateInput(service.actualDeliveryDate)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Discount">
                <Input type="number" name="discount" defaultValue={service.discount} />
              </Field>
              <Field label="Tax">
                <Input type="number" name="tax" defaultValue={service.tax} />
              </Field>
              <Field label="Payment Terms">
                <Input name="paymentTerms" defaultValue={service.paymentTerms ?? ""} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea name="description" defaultValue={service.description ?? ""} />
            </Field>
            <Button type="submit" size="sm" className="w-fit">
              Save Changes
            </Button>
          </form>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Financials</p>
          <div className="space-y-2 text-sm">
            <Row label="Service Value" value={formatCurrency(service.value)} />
            <Row label="Discount" value={`- ${formatCurrency(service.discount)}`} />
            <Row label="Tax" value={`+ ${formatCurrency(service.tax)}`} />
            <div className="my-1 h-px bg-gray-100" />
            <Row label="Total" value={formatCurrency(total)} bold />
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Team</p>
          <Row label="Project Manager" value={service.projectManager?.name ?? "Unassigned"} />
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={bold ? "font-semibold text-ink-900" : "text-ink-700"}>{value}</span>
    </div>
  );
}
