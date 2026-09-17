import { prisma } from "@/lib/prisma";

export async function listOpportunities(tenantId: string, filters: { stageKey?: string; ownerId?: string } = {}) {
  return prisma.opportunity.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters.stageKey ? { stage: { key: filters.stageKey } } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    },
    include: { customer: true, owner: true, stage: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOpportunity(tenantId: string, id: string) {
  return prisma.opportunity.findFirst({
    where: { tenantId, id },
    include: {
      customer: { include: { contacts: true } },
      lead: true,
      owner: true,
      stage: true,
      activities: { include: { assignedTo: true }, orderBy: { date: "desc" } },
      service: true,
      training: { include: { trainer: true } },
      quotations: true,
      invoices: { include: { payments: true } },
      approvals: { include: { requestedBy: true, reviewedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listPipelineStages(tenantId: string) {
  return prisma.pipelineStage.findMany({ where: { tenantId }, orderBy: { order: "asc" } });
}

export async function getPipelineBoard(tenantId: string) {
  const stages = await listPipelineStages(tenantId);
  const opportunities = await prisma.opportunity.findMany({
    where: { tenantId, deletedAt: null },
    include: { customer: true, owner: true },
    orderBy: { updatedAt: "desc" },
  });
  return stages.map((stage) => ({
    stage,
    opportunities: opportunities.filter((o) => o.stageId === stage.id),
  }));
}
