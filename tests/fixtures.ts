import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import type { MockSessionUser } from "./session-mock";

/** Creates a real Tenant + ADMIN Role + User in the test database, and
 * returns the same shape `requirePermission`/`requireTenantSession` hand to
 * server actions in production, so tests exercise real Prisma queries and
 * foreign-key constraints (e.g. AuditLog.userId) instead of a stub. */
export async function createTenantWithAdmin(label: string): Promise<{ tenantId: string; user: MockSessionUser }> {
  const unique = randomUUID();
  const tenant = await prisma.tenant.create({
    data: { name: `${label} ${unique}`, slug: `${label}-${unique}`.toLowerCase().replace(/[^a-z0-9-]/g, ""), status: "ACTIVE" },
  });
  const role = await prisma.role.create({
    data: { tenantId: tenant.id, name: "ADMIN", label: "Company Admin", permissions: ROLE_PERMISSIONS.ADMIN as object },
  });
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: role.id,
      name: `${label} Admin`,
      email: `${unique}@test.local`,
      passwordHash: "not-used-in-tests",
    },
  });

  return {
    tenantId: tenant.id,
    user: {
      id: user.id,
      tenantId: tenant.id,
      tenantName: tenant.name,
      name: user.name,
      email: user.email,
      roleName: "ADMIN",
      permissions: ROLE_PERMISSIONS.ADMIN,
    },
  };
}

export async function createCustomer(tenantId: string, name = "Test Customer") {
  return prisma.customer.create({ data: { tenantId, name } });
}

export async function createWonStage(tenantId: string) {
  return prisma.pipelineStage.create({ data: { tenantId, key: "WON", label: "Won", order: 1, isClosed: true, isWon: true } });
}

export async function createOpportunity(tenantId: string, customerId: string, stageId: string) {
  return prisma.opportunity.create({
    data: {
      tenantId,
      customerId,
      stageId,
      opportunityNo: `OP-TEST-${randomUUID().slice(0, 8)}`,
      requirement: "Test requirement",
      engagementType: "TRAINING",
      estimatedValue: 1000,
    },
  });
}

export async function createTrainingProgram(tenantId: string, opportunityId: string, customerId: string) {
  return prisma.trainingProgram.create({
    data: { tenantId, opportunityId, customerId, programName: "Test Training", fee: 1000 },
  });
}

export async function createTrainer(tenantId: string) {
  const role = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: "TRAINER" } },
    update: {},
    create: { tenantId, name: "TRAINER", label: "Trainer", permissions: ROLE_PERMISSIONS.TRAINER as object },
  });
  return prisma.user.create({
    data: { tenantId, roleId: role.id, name: "Test Trainer", email: `trainer-${randomUUID()}@test.local`, passwordHash: "not-used-in-tests" },
  });
}

export async function createQuotation(tenantId: string, customerId: string, opportunityId: string, status: "SENT" | "APPROVED" | "DRAFT" = "SENT") {
  return prisma.quotation.create({
    data: { tenantId, customerId, opportunityId, quotationNo: `QT-TEST-${randomUUID().slice(0, 8)}`, status, subtotal: 1000, total: 1000 },
  });
}

/** Deletes everything under a test tenant, in FK-safe order. */
export async function cleanupTenant(tenantId: string) {
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.quotation.deleteMany({ where: { tenantId } });
  await prisma.trainingProgram.deleteMany({ where: { tenantId } });
  await prisma.service.deleteMany({ where: { tenantId } });
  await prisma.approval.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.activity.deleteMany({ where: { tenantId } });
  await prisma.opportunity.deleteMany({ where: { tenantId } });
  await prisma.lead.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.pipelineStage.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.role.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
}
