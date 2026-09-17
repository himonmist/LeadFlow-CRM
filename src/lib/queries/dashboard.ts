import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subWeeks, startOfWeek, format, subMonths, startOfMonth } from "date-fns";

export async function getDashboardData(tenantId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    followUpsToday,
    overdueFollowUps,
    openOpportunities,
    wonStage,
    lostStage,
    upcomingServices,
    upcomingTraining,
    pendingInvoices,
    paidInvoicesAgg,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId, status: "NEW" } }),
    prisma.lead.count({ where: { tenantId, status: "QUALIFIED" } }),
    prisma.activity.count({ where: { tenantId, nextFollowUpDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.activity.count({ where: { tenantId, nextFollowUpDate: { lt: todayStart }, status: "PLANNED" } }),
    prisma.opportunity.count({ where: { tenantId, stage: { isClosed: false } } }),
    prisma.opportunity.count({ where: { tenantId, stage: { isWon: true } } }),
    prisma.opportunity.count({ where: { tenantId, stage: { key: "LOST" } } }),
    prisma.service.count({ where: { tenantId, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
    prisma.trainingProgram.count({ where: { tenantId, status: { in: ["SCHEDULED", "CONFIRMED", "PENDING"] } } }),
    prisma.invoice.count({ where: { tenantId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE", "PENDING_APPROVAL"] } } }),
    prisma.payment.aggregate({ where: { tenantId }, _sum: { amount: true } }),
  ]);

  // Lead acquisition trend: last 8 weeks
  const weeks: { label: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i));
    const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 86400000));
    const count = await prisma.lead.count({ where: { tenantId, leadDate: { gte: weekStart, lte: weekEnd } } });
    weeks.push({ label: format(weekStart, "MMM d"), count });
  }

  // Pipeline value by stage
  const stages = await prisma.pipelineStage.findMany({ where: { tenantId }, orderBy: { order: "asc" } });
  const pipelineByStage = await Promise.all(
    stages.map(async (stage) => {
      const agg = await prisma.opportunity.aggregate({
        where: { tenantId, stageId: stage.id },
        _sum: { estimatedValue: true },
        _count: true,
      });
      return { stage: stage.label, value: agg._sum.estimatedValue ?? 0, count: agg._count };
    })
  );

  // Revenue trend: last 6 months (paid amount via payments)
  const months: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
    const agg = await prisma.payment.aggregate({
      where: { tenantId, paymentDate: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    });
    months.push({ label: format(monthStart, "MMM"), revenue: agg._sum.amount ?? 0 });
  }

  // Lead source performance
  const leadsBySource = await prisma.lead.groupBy({
    by: ["source"],
    where: { tenantId },
    _count: true,
  });

  // Service vs training revenue (estimated value of won opportunities)
  const [serviceRevenue, trainingRevenue] = await Promise.all([
    prisma.opportunity.aggregate({ where: { tenantId, engagementType: "SERVICE", stage: { isWon: true } }, _sum: { estimatedValue: true } }),
    prisma.opportunity.aggregate({ where: { tenantId, engagementType: "TRAINING", stage: { isWon: true } }, _sum: { estimatedValue: true } }),
  ]);

  // Employee performance
  const users = await prisma.user.findMany({ where: { tenantId, deletedAt: null }, include: { role: true } });
  const employeePerformance = await Promise.all(
    users
      .filter((u) => ["MANAGER", "SALES", "MARKETING"].includes(u.role.name))
      .map(async (u) => {
        const [leadsCount, followUps, won, revenue] = await Promise.all([
          prisma.lead.count({ where: { tenantId, ownerId: u.id } }),
          prisma.activity.count({ where: { tenantId, assignedToId: u.id } }),
          prisma.opportunity.count({ where: { tenantId, ownerId: u.id, stage: { isWon: true } } }),
          prisma.opportunity.aggregate({ where: { tenantId, ownerId: u.id, stage: { isWon: true } }, _sum: { estimatedValue: true } }),
        ]);
        return { name: u.name, leads: leadsCount, followUps, won, revenue: revenue._sum.estimatedValue ?? 0 };
      })
  );

  // Today's actions
  const todaysActivities = await prisma.activity.findMany({
    where: { tenantId, date: { gte: todayStart, lte: todayEnd } },
    include: { assignedTo: true, customer: true, lead: true },
    orderBy: { startTime: "asc" },
    take: 8,
  });

  return {
    kpis: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      followUpsToday,
      overdueFollowUps,
      openOpportunities,
      wonDeals: wonStage,
      lostDeals: lostStage,
      upcomingServices,
      upcomingTraining,
      pendingInvoices,
      revenue: paidInvoicesAgg._sum.amount ?? 0,
    },
    leadTrend: weeks,
    pipelineByStage,
    revenueTrend: months,
    leadsBySource: leadsBySource.map((l) => ({ source: l.source, count: l._count })),
    engagementRevenue: {
      service: serviceRevenue._sum.estimatedValue ?? 0,
      training: trainingRevenue._sum.estimatedValue ?? 0,
    },
    employeePerformance,
    todaysActivities,
  };
}
