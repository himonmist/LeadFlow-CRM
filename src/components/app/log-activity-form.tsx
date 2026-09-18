"use client";

import { useState } from "react";
import { logActivity } from "@/app/app/activities/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const ACTIVITY_TYPES = [
  "PHONE_CALL",
  "EMAIL",
  "WHATSAPP",
  "ONLINE_MEETING",
  "PHYSICAL_MEETING",
  "DEMO",
  "PROPOSAL_SENT",
  "QUOTATION_SENT",
  "FOLLOW_UP",
  "REMINDER",
  "TRAINING_DISCUSSION",
  "CONTRACT_DISCUSSION",
  "PAYMENT_DISCUSSION",
  "OTHER",
];

export function LogActivityForm({
  leadId,
  opportunityId,
  customerId,
  owners,
  returnTo,
}: {
  leadId?: string;
  opportunityId?: string;
  customerId?: string;
  owners: { id: string; name: string }[];
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Log Activity
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await logActivity(fd);
        setOpen(false);
      }}
      className="card mt-3 grid gap-3 p-4"
    >
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Activity Type" required>
          <Select name="type" required defaultValue="PHONE_CALL">
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" required>
          <Input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="COMPLETED">
            <option value="PLANNED">Planned</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start Time">
          <Input type="time" name="startTime" />
        </Field>
        <Field label="End Time">
          <Input type="time" name="endTime" />
        </Field>
      </div>
      <Field label="Subject" required>
        <Input name="subject" required placeholder="e.g. Follow-up call" />
      </Field>
      <Field label="Outcome">
        <Textarea name="outcome" placeholder="What happened?" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Assigned To">
          <Select name="assignedToId" defaultValue="">
            <option value="">Me</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next Follow-up Date">
          <Input type="date" name="nextFollowUpDate" />
        </Field>
      </div>
      <Field label="Next Action">
        <Input name="nextAction" placeholder="e.g. Send revised proposal" />
      </Field>
      <Field label="Internal Note">
        <Textarea name="internalNote" placeholder="Visible to your team only" />
      </Field>

      <div className="flex gap-2">
        <SubmitButton size="sm" pendingLabel="Saving...">
          Save Activity
        </SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
