"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateSmtpConfig, sendTestSmtpEmail, sendFollowUpRemindersNow, type SmtpFormState } from "@/app/app/settings/actions";

const initialState: SmtpFormState = {};

export function SmtpConfigForm({
  tenantId,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpFromEmail,
  smtpFromName,
  smtpSecure,
  hasPassword,
  userEmail,
}: {
  tenantId: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
  hasPassword: boolean;
  userEmail: string;
}) {
  const [saveState, saveAction] = useActionState(updateSmtpConfig, initialState);
  const [testState, testAction] = useActionState(sendTestSmtpEmail, initialState);
  const [reminderState, reminderAction] = useActionState(sendFollowUpRemindersNow, initialState);

  return (
    <div className="grid gap-4">
      <form action={saveAction} key={tenantId} className="grid gap-4 sm:grid-cols-2">
        <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
          <Input name="smtpHost" defaultValue={smtpHost} placeholder="smtp.yourprovider.com" />
        </Field>
        <Field label="SMTP Port">
          <Input type="number" name="smtpPort" defaultValue={smtpPort} placeholder="587" />
        </Field>
        <Field label="SMTP Username">
          <Input name="smtpUser" defaultValue={smtpUser} placeholder="you@company.com" />
        </Field>
        <Field label="SMTP Password" hint={hasPassword ? "Leave blank to keep the current password." : undefined}>
          <Input type="password" name="smtpPassword" placeholder={hasPassword ? "••••••••" : "Password"} autoComplete="new-password" />
        </Field>
        <Field label="From Email">
          <Input type="email" name="smtpFromEmail" defaultValue={smtpFromEmail} placeholder="notifications@company.com" />
        </Field>
        <Field label="From Name">
          <Input name="smtpFromName" defaultValue={smtpFromName} placeholder="LeadFlow Notifications" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
          <input type="checkbox" name="smtpSecure" defaultChecked={smtpSecure} />
          Use TLS/SSL (recommended, matches port 465; uncheck for STARTTLS on port 587)
        </label>

        {saveState.error && <p className="text-sm text-red-600 sm:col-span-2">{saveState.error}</p>}
        {saveState.success && <p className="text-sm text-green-600 sm:col-span-2">{saveState.success}</p>}

        <SubmitButton size="sm" className="w-fit" pendingLabel="Saving...">
          Save Email Settings
        </SubmitButton>
      </form>

      <form action={testAction} className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
        <Field label="Send a test email to">
          <Input type="email" name="testEmailTo" defaultValue={userEmail} className="w-64" />
        </Field>
        <SubmitButton size="sm" variant="secondary" pendingLabel="Sending...">
          Send Test Email
        </SubmitButton>
        {testState.error && <p className="text-sm text-red-600">{testState.error}</p>}
        {testState.success && <p className="text-sm text-green-600">{testState.success}</p>}
      </form>

      <form action={reminderAction} className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <SubmitButton size="sm" variant="secondary" pendingLabel="Sending...">
          Send Follow-up Reminders Now
        </SubmitButton>
        <p className="text-xs text-ink-400">Emails your team about any due or overdue follow-ups. Runs automatically every day too.</p>
        {reminderState.error && <p className="text-sm text-red-600">{reminderState.error}</p>}
        {reminderState.success && <p className="text-sm text-green-600">{reminderState.success}</p>}
      </form>
    </div>
  );
}
