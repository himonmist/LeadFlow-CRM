import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getTrainingProgram, listTrainers } from "@/lib/queries/training";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateTrainingProgram } from "../actions";

const STATUSES = ["SCHEDULED", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"];

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("training", "view");
  const { id } = await params;
  const [training, trainers] = await Promise.all([getTrainingProgram(user.tenantId, id), listTrainers(user.tenantId)]);
  if (!training) notFound();

  const total = training.fee - training.discount + training.tax;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink-900">{training.programName}</h1>
          <StatusBadge status={training.status} />
        </div>
        <p className="text-sm text-ink-500">
          <Link href={`/app/customers/${training.customer.id}`} className="text-brand-600">
            {training.customer.name}
          </Link>{" "}
          · <Link href={`/app/opportunities/${training.opportunityId}`} className="text-brand-600">Opportunity</Link>
        </p>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Schedule &amp; Delivery</p>
          <form action={updateTrainingProgram} className="grid gap-4">
            <input type="hidden" name="trainingId" value={training.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status">
                <Select name="status" defaultValue={training.status}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Trainer">
                <Select name="trainerId" defaultValue={training.trainerId ?? ""}>
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Delivery Mode">
                <Select name="deliveryMode" defaultValue={training.deliveryMode}>
                  <option value="PHYSICAL">Physical</option>
                  <option value="ONLINE">Online</option>
                  <option value="HYBRID">Hybrid</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Training Date">
                <Input type="date" name="trainingDate" defaultValue={toDateInput(training.trainingDate)} />
              </Field>
              <Field label="Start Time">
                <Input type="time" name="startTime" defaultValue={training.startTime ?? ""} />
              </Field>
              <Field label="End Time">
                <Input type="time" name="endTime" defaultValue={training.endTime ?? ""} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue">
                <Input name="venue" defaultValue={training.venue ?? ""} placeholder="Client training center" />
              </Field>
              <Field label="Online Meeting Link">
                <Input name="meetingLink" defaultValue={training.meetingLink ?? ""} placeholder="https://meet…" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Participants">
                <Input type="number" name="participants" defaultValue={training.participants ?? ""} />
              </Field>
              <Field label="Coordinator">
                <Input name="coordinator" defaultValue={training.coordinator ?? ""} />
              </Field>
              <Field label="Category">
                <Input name="category" defaultValue={training.category ?? ""} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount">
                <Input type="number" name="discount" defaultValue={training.discount} />
              </Field>
              <Field label="Tax">
                <Input type="number" name="tax" defaultValue={training.tax} />
              </Field>
            </div>
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
            <Row label="Fee" value={formatCurrency(training.fee)} />
            <Row label="Discount" value={`- ${formatCurrency(training.discount)}`} />
            <Row label="Tax" value={`+ ${formatCurrency(training.tax)}`} />
            <div className="my-1 h-px bg-gray-100" />
            <Row label="Total" value={formatCurrency(total)} bold />
          </div>
        </Card>
        {training.trainingDate && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">At a glance</p>
            <Row label="Date" value={formatDate(training.trainingDate)} />
            <Row label="Time" value={`${training.startTime ?? "—"} – ${training.endTime ?? "—"}`} />
            <Row label="Mode" value={training.deliveryMode} />
          </Card>
        )}
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
