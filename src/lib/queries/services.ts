import { prisma } from "@/lib/prisma";

export async function listServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    include: { customer: true, projectManager: true, opportunity: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getService(tenantId: string, id: string) {
  return prisma.service.findFirst({
    where: { tenantId, id },
    include: { customer: true, projectManager: true, opportunity: { include: { activities: true } } },
  });
}
