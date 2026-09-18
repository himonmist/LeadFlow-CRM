import { prisma } from "@/lib/prisma";
import { sendTenantEmail } from "@/lib/email";

type ReminderItem = { label: string; link: string; due: Date };

/**
 * Finds every due (today or overdue) follow-up — both planned Activities
 * and an Opportunity's own "next follow-up" field — and emails each owner
 * one summary through their tenant's configured SMTP. Tenants without SMTP
 * configured are silently skipped (counted, not errored) since there's
 * nowhere to send the email.
 *
 * With no tenantId, this runs across every tenant (used by the daily cron).
 * Pass a tenantId to scope it to one company (used by the manual "Send Now"
 * button in that company's Settings) so triggering it never emails another
 * tenant's team.
 */
export async function runFollowUpReminders(tenantId?: string) {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const tenantFilter = tenantId ? { tenantId } : {};

  const [dueActivities, dueOpportunities] = await Promise.all([
    prisma.activity.findMany({
      where: { ...tenantFilter, nextFollowUpDate: { lte: todayEnd }, status: "PLANNED", assignedToId: { not: null } },
      include: { assignedTo: true, lead: true, opportunity: true },
    }),
    prisma.opportunity.findMany({
      where: { ...tenantFilter, nextFollowUpDate: { lte: todayEnd }, ownerId: { not: null }, stage: { isClosed: false } },
      include: { owner: true, stage: true },
    }),
  ]);

  // ownerId -> { tenantId, email, name, items }
  const byOwner = new Map<string, { tenantId: string; email: string; name: string; items: ReminderItem[] }>();

  const addItem = (ownerId: string | null, tenantId: string, email: string, name: string, item: ReminderItem) => {
    if (!ownerId) return;
    const entry = byOwner.get(ownerId) ?? { tenantId, email, name, items: [] };
    entry.items.push(item);
    byOwner.set(ownerId, entry);
  };

  for (const a of dueActivities) {
    if (!a.assignedTo || !a.assignedToId) continue;
    const label = a.lead ? `Lead: ${a.lead.companyName} — ${a.subject}` : a.opportunity ? `Opportunity: ${a.opportunity.opportunityNo} — ${a.subject}` : a.subject;
    const link = a.leadId ? `${baseUrl}/app/leads/${a.leadId}` : a.opportunityId ? `${baseUrl}/app/opportunities/${a.opportunityId}` : baseUrl;
    addItem(a.assignedToId, a.tenantId, a.assignedTo.email, a.assignedTo.name, { label, link, due: a.nextFollowUpDate! });
  }

  for (const o of dueOpportunities) {
    if (!o.owner || !o.ownerId) continue;
    addItem(o.ownerId, o.tenantId, o.owner.email, o.owner.name, {
      label: `Opportunity: ${o.opportunityNo} — ${o.nextAction ?? "Follow up"}`,
      link: `${baseUrl}/app/opportunities/${o.id}`,
      due: o.nextFollowUpDate!,
    });
  }

  let sent = 0;
  let skippedNoSmtp = 0;

  for (const [, owner] of byOwner) {
    const rows = owner.items
      .sort((x, y) => x.due.getTime() - y.due.getTime())
      .map((i) => `<li><a href="${i.link}">${i.label}</a> — due ${i.due.toLocaleDateString()}</li>`)
      .join("");

    const result = await sendTenantEmail(owner.tenantId, {
      to: owner.email,
      subject: `You have ${owner.items.length} follow-up${owner.items.length === 1 ? "" : "s"} due`,
      html: `<p>Hi ${owner.name},</p><p>Here${owner.items.length === 1 ? "'s" : " are"} your due follow-up${owner.items.length === 1 ? "" : "s"}:</p><ul>${rows}</ul>`,
    });

    if (result.sent) sent++;
    else skippedNoSmtp++;
  }

  return { ownersNotified: sent, ownersSkipped: skippedNoSmtp, itemsFound: dueActivities.length + dueOpportunities.length };
}
