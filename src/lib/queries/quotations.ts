import { prisma } from "@/lib/prisma";

export async function listQuotations(tenantId: string) {
  return prisma.quotation.findMany({
    where: { tenantId },
    include: { customer: true, opportunity: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuotation(tenantId: string, id: string) {
  return prisma.quotation.findFirst({
    where: { tenantId, id },
    include: { customer: true, opportunity: true, items: true, invoices: true },
  });
}
