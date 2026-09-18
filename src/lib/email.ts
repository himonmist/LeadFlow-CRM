import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type SendResult = { sent: true } | { sent: false; reason: string };

async function getTenantMailer(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPassword: true, smtpFromEmail: true, smtpFromName: true, smtpSecure: true },
  });
  if (!tenant?.smtpHost || !tenant.smtpUser || !tenant.smtpPassword || !tenant.smtpFromEmail) return null;

  const transporter = nodemailer.createTransport({
    host: tenant.smtpHost,
    port: tenant.smtpPort ?? 587,
    secure: tenant.smtpSecure,
    auth: { user: tenant.smtpUser, pass: tenant.smtpPassword },
  });
  const from = tenant.smtpFromName ? `"${tenant.smtpFromName}" <${tenant.smtpFromEmail}>` : tenant.smtpFromEmail;
  return { transporter, from };
}

/**
 * Sends an email through a tenant's own configured SMTP server (set in
 * Settings). If the tenant hasn't configured SMTP yet, this is a no-op that
 * reports why instead of throwing — callers decide whether that's fatal.
 */
export async function sendTenantEmail(
  tenantId: string,
  opts: { to: string; subject: string; html: string; text?: string },
): Promise<SendResult> {
  const mailer = await getTenantMailer(tenantId);
  if (!mailer) return { sent: false, reason: "SMTP is not configured for this company yet (Settings > Email)." };

  try {
    await mailer.transporter.sendMail({ from: mailer.from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Failed to send email." };
  }
}
