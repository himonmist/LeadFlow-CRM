import { prisma } from "@/lib/prisma";

export async function listLeads(tenantId: string, filters: { status?: string; ownerId?: string; q?: string } = {}) {
  return prisma.lead.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
      ...(filters.q
        ? { companyName: { contains: filters.q } }
        : {}),
    },
    include: { owner: true, opportunities: true },
    orderBy: { leadDate: "desc" },
  });
}

export async function getLead(tenantId: string, id: string) {
  return prisma.lead.findFirst({
    where: { tenantId, id },
    include: {
      owner: true,
      contact: true,
      customer: true,
      opportunities: { include: { stage: true } },
      activities: { include: { assignedTo: true }, orderBy: { date: "desc" } },
    },
  });
}

export async function listOwners(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, deletedAt: null, role: { name: { in: ["MANAGER", "SALES", "MARKETING", "ADMIN"] } } },
    orderBy: { name: "asc" },
  });
}
