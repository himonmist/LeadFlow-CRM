import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmtpConfigForm } from "@/components/app/smtp-config-form";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { updateTenantProfile } from "./actions";

export default async function SettingsPage() {
  // Every authenticated user can reach this page and change their own
  // password here, regardless of role — only the company-wide sections
  // below (profile, SMTP, pipeline, roles) require "settings" permission.
  const user = await requireTenantSession();
  const canView = can(user.permissions, "settings", "view");
  const canEdit = can(user.permissions, "settings", "edit");

  const [tenant, stages, roles] = canView
    ? await Promise.all([
        prisma.tenant.findUnique({ where: { id: user.tenantId } }),
        prisma.pipelineStage.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
        prisma.role.findMany({ where: { tenantId: null } }),
      ])
    : [null, [], []];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Company profile, pipeline configuration and role permissions.</p>
      </div>

      {canView && (
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Company Profile</p>
          <form action={updateTenantProfile} className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" required>
              <Input name="name" required defaultValue={tenant?.name} disabled={!canEdit} />
            </Field>
            <Field label="Industry">
              <Input name="industry" defaultValue={tenant?.industry ?? ""} disabled={!canEdit} />
            </Field>
            <Field label="Website">
              <Input name="website" defaultValue={tenant?.website ?? ""} disabled={!canEdit} />
            </Field>
            <Field label="Country">
              <Input name="country" defaultValue={tenant?.country ?? ""} disabled={!canEdit} />
            </Field>
            <Field label="Address">
              <Input name="address" defaultValue={tenant?.address ?? ""} disabled={!canEdit} />
            </Field>
            <div className="flex items-end gap-3 text-sm text-ink-500">
              <span>Plan: <Badge tone="info">{tenant?.planTier}</Badge></span>
              <span>Status: <Badge tone={tenant?.status === "ACTIVE" ? "success" : "warning"}>{tenant?.status}</Badge></span>
            </div>
            {canEdit && (
              <Button type="submit" size="sm" className="w-fit">
                Save Changes
              </Button>
            )}
          </form>
        </Card>
      )}

      {canEdit && (
        <Card>
          <p className="mb-1 text-sm font-semibold text-ink-900">Email (SMTP) Configuration</p>
          <p className="mb-3 text-xs text-ink-500">
            Configure your company&rsquo;s outgoing email server. It&rsquo;s used to send follow-up reminders, password reset
            links, and password-change confirmations.
          </p>
          <SmtpConfigForm
            tenantId={user.tenantId}
            smtpHost={tenant?.smtpHost ?? ""}
            smtpPort={tenant?.smtpPort ? String(tenant.smtpPort) : ""}
            smtpUser={tenant?.smtpUser ?? ""}
            smtpFromEmail={tenant?.smtpFromEmail ?? ""}
            smtpFromName={tenant?.smtpFromName ?? ""}
            smtpSecure={tenant?.smtpSecure ?? true}
            hasPassword={!!tenant?.smtpPassword}
            userEmail={user.email}
          />
        </Card>
      )}

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink-900">Change Your Password</p>
        <ChangePasswordForm />
      </Card>

      {canView && (
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Pipeline Stages</p>
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <Badge key={s.id} tone={s.isWon ? "success" : s.isClosed ? "danger" : "info"}>
                {s.order}. {s.label}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">Stage reordering and custom stages are configurable by Super Admin in a future release.</p>
        </Card>
      )}

      {canView && (
        <Card className="overflow-x-auto">
          <p className="mb-3 text-sm font-semibold text-ink-900">Roles &amp; Permissions</p>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 font-medium">Access Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roles.map((r) => {
                const perms = r.permissions as Record<string, string[]>;
                const summary = Object.entries(perms)
                  .filter(([, actions]) => actions.length > 0)
                  .map(([entity]) => entity)
                  .join(", ");
                return (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-4 font-medium text-ink-900">{r.label}</td>
                    <td className="py-2.5 text-ink-500">{summary || "No access"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
