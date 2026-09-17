import { prisma } from "@/lib/prisma";

export async function listCustomers(tenantId: string, q?: string) {
  return prisma.customer.findMany({
    where: { tenantId, deletedAt: null, ...(q ? { name: { contains: q } } : {}) },
    include: { contacts: true, opportunities: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerTimeline(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { tenantId, id: customerId },
    include: {
      contacts: true,
      leads: { orderBy: { leadDate: "desc" } },
      opportunities: { include: { stage: true }, orderBy: { createdAt: "desc" } },
      services: true,
      trainings: true,
      quotations: { orderBy: { createdAt: "desc" } },
      invoices: { include: { payments: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return null;

  const activities = await prisma.activity.findMany({
    where: { tenantId, customerId },
    include: { assignedTo: true },
    orderBy: { date: "desc" },
  });

  type TimelineEvent = { date: Date; label: string; detail?: string };
  const events: TimelineEvent[] = [];

  for (const lead of customer.leads) {
    events.push({ date: lead.leadDate, label: "Lead Created", detail: `${lead.leadNumber} · ${lead.businessInterest.replace(/_/g, " ")}` });
  }
  for (const activity of activities) {
    events.push({ date: activity.date, label: activity.type.replace(/_/g, " "), detail: activity.subject });
  }
  for (const opp of customer.opportunities) {
    events.push({ date: opp.createdAt, label: "Opportunity Created", detail: `${opp.opportunityNo} · ${opp.requirement}` });
    if (opp.stage.isWon) {
      events.push({ date: opp.updatedAt, label: "Deal Won", detail: opp.opportunityNo });
    }
  }
  for (const q of customer.quotations) {
    events.push({ date: q.createdAt, label: "Quotation Sent", detail: `${q.quotationNo} · ${q.total}` });
  }
  for (const s of customer.services) {
    events.push({ date: s.createdAt, label: "Service Scheduled", detail: s.name });
    if (s.actualDeliveryDate) events.push({ date: s.actualDeliveryDate, label: "Service Delivered", detail: s.name });
  }
  for (const t of customer.trainings) {
    events.push({ date: t.createdAt, label: "Training Scheduled", detail: t.programName });
    if (t.status === "COMPLETED" && t.trainingDate) events.push({ date: t.trainingDate, label: "Training Completed", detail: t.programName });
  }
  for (const inv of customer.invoices) {
    events.push({ date: inv.createdAt, label: "Invoice Generated", detail: `${inv.invoiceNo} · ${inv.total}` });
    for (const p of inv.payments) {
      events.push({ date: p.paymentDate, label: "Payment Received", detail: `${inv.invoiceNo} · ${p.amount}` });
    }
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { customer, activities, events };
}
