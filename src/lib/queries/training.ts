import { prisma } from "@/lib/prisma";

export async function listTrainingPrograms(tenantId: string) {
  return prisma.trainingProgram.findMany({
    where: { tenantId },
    include: { customer: true, trainer: true, opportunity: true },
    orderBy: { trainingDate: "asc" },
  });
}

export async function getTrainingProgram(tenantId: string, id: string) {
  return prisma.trainingProgram.findFirst({
    where: { tenantId, id },
    include: { customer: true, trainer: true, opportunity: true },
  });
}

export async function listTrainers(tenantId: string) {
  return prisma.user.findMany({ where: { tenantId, role: { name: "TRAINER" }, deletedAt: null }, orderBy: { name: "asc" } });
}
