"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword, type ChangePasswordState } from "@/app/app/settings/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="grid max-w-sm gap-4">
      <Field label="Current Password" required>
        <Input type="password" name="currentPassword" required autoComplete="current-password" />
      </Field>
      <Field label="New Password" required hint="At least 8 characters.">
        <Input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Confirm New Password" required>
        <Input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}

      <SubmitButton size="sm" className="w-fit" pendingLabel="Changing...">
        Change Password
      </SubmitButton>
    </form>
  );
}
