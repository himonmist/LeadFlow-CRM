import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function listApprovals(tenantId: string) {
  return prisma.approval.findMany({
    where: { tenantId },
    include: {
      requestedBy: true,
      reviewedBy: true,
      opportunity: { include: { customer: true } },
      quotation: { include: { customer: true } },
      invoice: { include: { customer: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getManagerAlerts(tenantId: string) {
  const staleSince = subDays(new Date(), 5);

  const [overdueFollowUps, unassignedLeads, staleLeads, highValueOpen] = await Promise.all([
    prisma.activity.findMany({
      where: { tenantId, status: "PLANNED", nextFollowUpDate: { lt: new Date() } },
      include: { assignedTo: true, customer: true, lead: true },
      take: 5,
    }),
    prisma.lead.findMany({ where: { tenantId, ownerId: null, deletedAt: null }, take: 5 }),
    prisma.lead.findMany({
      where: { tenantId, deletedAt: null, status: { in: ["NEW", "CONTACTED"] }, leadDate: { lt: staleSince } },
      take: 5,
    }),
    prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, estimatedValue: { gt: 500000 }, stage: { isClosed: false } },
      include: { customer: true },
      take: 5,
    }),
  ]);

  return { overdueFollowUps, unassignedLeads, staleLeads, highValueOpen };
}
