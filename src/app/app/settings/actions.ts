"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireTenantSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { sendTenantEmail } from "@/lib/email";
import { runFollowUpReminders } from "@/lib/reminders";

export async function updateTenantProfile(formData: FormData) {
  const user = await requirePermission("settings", "edit");
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      name: String(formData.get("name")),
      industry: String(formData.get("industry") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      country: String(formData.get("country") || "") || undefined,
    },
  });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "UPDATE", entityType: "Tenant", entityId: user.tenantId });
  revalidatePath("/app/settings");
}

export type SmtpFormState = { error?: string; success?: string };

export async function updateSmtpConfig(_prev: SmtpFormState, formData: FormData): Promise<SmtpFormState> {
  const user = await requirePermission("settings", "edit");

  const host = String(formData.get("smtpHost") || "") || undefined;
  const portRaw = String(formData.get("smtpPort") || "");
  const port = portRaw ? Number(portRaw) : undefined;
  const smtpUser = String(formData.get("smtpUser") || "") || undefined;
  const password = String(formData.get("smtpPassword") || "");
  const fromEmail = String(formData.get("smtpFromEmail") || "") || undefined;
  const fromName = String(formData.get("smtpFromName") || "") || undefined;
  const secure = formData.get("smtpSecure") === "on";

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      smtpHost: host,
      smtpPort: port,
      smtpUser,
      // An empty password field means "leave the stored password alone" —
      // the field is never pre-filled with the real value, so an empty
      // submit is never a deliberate clear.
      smtpPassword: password ? password : undefined,
      smtpFromEmail: fromEmail,
      smtpFromName: fromName,
      smtpSecure: secure,
    },
  });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "UPDATE", entityType: "Tenant", entityId: user.tenantId, after: { smtpHost: host, smtpUser } });
  revalidatePath("/app/settings");
  return { success: "Email settings saved." };
}

export async function sendTestSmtpEmail(_prev: SmtpFormState, formData: FormData): Promise<SmtpFormState> {
  const user = await requirePermission("settings", "edit");
  const to = String(formData.get("testEmailTo") || user.email);

  const result = await sendTenantEmail(user.tenantId, {
    to,
    subject: "LeadFlow test email",
    html: `<p>This is a test email from your LeadFlow workspace (${user.tenantName}). If you received this, your SMTP configuration is working.</p>`,
  });

  if (!result.sent) return { error: result.reason };
  return { success: `Test email sent to ${to}.` };
}

export async function sendFollowUpRemindersNow(_prev: SmtpFormState, _formData: FormData): Promise<SmtpFormState> {
  const user = await requirePermission("settings", "edit");
  const result = await runFollowUpReminders(user.tenantId);

  if (result.itemsFound === 0) return { success: "No follow-ups are due right now." };
  if (result.ownersNotified === 0) return { error: `Found ${result.itemsFound} due follow-up(s), but SMTP isn't configured yet — no emails were sent.` };
  return { success: `Emailed ${result.ownersNotified} team member(s) about ${result.itemsFound} due follow-up(s).` };
}

export type ChangePasswordState = { error?: string; success?: string };

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const sessionUser = await requireTenantSession();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword) return { error: "New password and confirmation don't match." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ tenantId: sessionUser.tenantId, userId: user.id, action: "UPDATE", entityType: "User", entityId: user.id, after: { passwordChanged: true } });

  await sendTenantEmail(sessionUser.tenantId, {
    to: user.email,
    subject: "Your LeadFlow password was changed",
    html: `<p>Hi ${user.name},</p><p>This is a confirmation that your LeadFlow password was just changed. If this wasn't you, contact your workspace admin immediately.</p>`,
  });

  return { success: "Password changed." };
}
