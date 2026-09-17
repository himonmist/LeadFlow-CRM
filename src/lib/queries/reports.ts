import { prisma } from "@/lib/prisma";

export async function getReportsData(tenantId: string) {
  const [leadsBySource, leadsByStatus, leadsByIndustry, opportunitiesByStage, services, trainings, invoices] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], where: { tenantId }, _count: true }),
    prisma.lead.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
    prisma.lead.groupBy({ by: ["industry"], where: { tenantId, industry: { not: null } }, _count: true }),
    prisma.opportunity.findMany({ where: { tenantId }, include: { stage: true } }),
    prisma.service.findMany({ where: { tenantId } }),
    prisma.trainingProgram.findMany({ where: { tenantId }, include: { trainer: true } }),
    prisma.invoice.findMany({ where: { tenantId } }),
  ]);

  const totalLeads = leadsByStatus.reduce((s, l) => s + l._count, 0);
  const converted = leadsByStatus.find((l) => l.status === "CONVERTED")?._count ?? 0;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0";

  const wonValue = opportunitiesByStage.filter((o) => o.stage.isWon).reduce((s, o) => s + o.estimatedValue, 0);
  const lostValue = opportunitiesByStage.filter((o) => o.stage.key === "LOST").reduce((s, o) => s + o.estimatedValue, 0);
  const pipelineValue = opportunitiesByStage.filter((o) => !o.stage.isClosed).reduce((s, o) => s + o.estimatedValue, 0);

  const servicesDelivered = services.filter((s) => s.status === "COMPLETED").length;
  const upcomingServices = services.filter((s) => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(s.status)).length;
  const delayedServices = services.filter((s) => s.expectedDeliveryDate && s.expectedDeliveryDate < new Date() && s.status !== "COMPLETED").length;

  const trainerUtilization = new Map<string, number>();
  for (const t of trainings) {
    if (t.trainer) trainerUtilization.set(t.trainer.name, (trainerUtilization.get(t.trainer.name) ?? 0) + 1);
  }

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = totalInvoiced - totalPaid;
  const overdue = invoices.filter((i) => i.dueDate && i.dueDate < new Date() && i.paidAmount < i.total).reduce((s, i) => s + (i.total - i.paidAmount), 0);

  return {
    leadsBySource,
    leadsByStatus,
    leadsByIndustry,
    conversionRate,
    pipelineValue,
    wonValue,
    lostValue,
    servicesDelivered,
    upcomingServices,
    delayedServices,
    trainingCount: trainings.length,
    trainingParticipants: trainings.reduce((s, t) => s + (t.participants ?? 0), 0),
    trainingRevenue: trainings.reduce((s, t) => s + t.fee, 0),
    upcomingTraining: trainings.filter((t) => ["SCHEDULED", "CONFIRMED", "PENDING"].includes(t.status)).length,
    completedTraining: trainings.filter((t) => t.status === "COMPLETED").length,
    trainerUtilization: Array.from(trainerUtilization.entries()).map(([name, count]) => ({ name, count })),
    totalInvoiced,
    totalPaid,
    outstanding,
    overdue,
  };
}
