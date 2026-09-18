"use client";

import { useState } from "react";
import { updateOpportunityDetails } from "@/app/app/opportunities/actions";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function EditOpportunityForm({
  opportunityId,
  programName,
  requirement,
  estimatedValue,
  priority,
}: {
  opportunityId: string;
  programName: string | null;
  requirement: string;
  estimatedValue: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
        Edit
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await updateOpportunityDetails(fd);
        setEditing(false);
      }}
      className="mt-3 grid gap-3 rounded-lg border border-gray-100 p-3 sm:grid-cols-2"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <Field label="Program / Service">
        <Input name="programName" defaultValue={programName ?? ""} placeholder="e.g. AI Training for Haematology Doctors" />
      </Field>
      <Field label="Requirement" required>
        <Input name="requirement" required defaultValue={requirement} />
      </Field>
      <Field label="Estimated Value" required>
        <Input type="number" name="estimatedValue" required min={0} step="0.01" defaultValue={estimatedValue} />
      </Field>
      <Field label="Priority">
        <Select name="priority" defaultValue={priority}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton size="sm" pendingLabel="Saving...">
          Save Changes
        </SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
