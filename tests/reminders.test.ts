import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createCustomer, createTenantWithAdmin } from "./fixtures";

const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn().mockResolvedValue({}) }));
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

import { runFollowUpReminders } from "@/lib/reminders";

async function createOpenStage(tenantId: string) {
  return prisma.pipelineStage.create({ data: { tenantId, key: "NEW", label: "New", order: 0 } });
}

describe("runFollowUpReminders", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  beforeEach(() => {
    sendMailMock.mockClear();
  });

  it("finds due items but sends nothing when the tenant hasn't configured SMTP", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reminders-nosmtp");
    tenantIds.push(tenantId);
    const customer = await createCustomer(tenantId);
    const stage = await createOpenStage(tenantId);
    await prisma.opportunity.create({
      data: {
        tenantId, customerId: customer.id, stageId: stage.id, opportunityNo: "OP-R1", requirement: "x",
        ownerId: user.id, nextFollowUpDate: new Date(Date.now() - 86400000),
      },
    });

    const result = await runFollowUpReminders(tenantId);

    expect(result.itemsFound).toBe(1);
    expect(result.ownersNotified).toBe(0);
    expect(result.ownersSkipped).toBe(1);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("emails the owner once SMTP is configured, scoped to only that tenant's due items", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reminders-smtp");
    tenantIds.push(tenantId);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { smtpHost: "smtp.test", smtpPort: 587, smtpUser: "u", smtpPassword: "p", smtpFromEmail: "from@test.local", smtpSecure: false },
    });
    const customer = await createCustomer(tenantId);
    const stage = await createOpenStage(tenantId);
    await prisma.opportunity.create({
      data: { tenantId, customerId: customer.id, stageId: stage.id, opportunityNo: "OP-R2", requirement: "x", ownerId: user.id, nextFollowUpDate: new Date() },
    });

    // A second tenant with its own due item — a scoped run for the first
    // tenant must not see or email this one.
    const other = await createTenantWithAdmin("reminders-other");
    tenantIds.push(other.tenantId);
    const otherCustomer = await createCustomer(other.tenantId);
    const otherStage = await createOpenStage(other.tenantId);
    await prisma.opportunity.create({
      data: { tenantId: other.tenantId, customerId: otherCustomer.id, stageId: otherStage.id, opportunityNo: "OP-R3", requirement: "y", ownerId: other.user.id, nextFollowUpDate: new Date() },
    });

    const result = await runFollowUpReminders(tenantId);

    expect(result.itemsFound).toBe(1);
    expect(result.ownersNotified).toBe(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe(user.email);
  });

  it("ignores opportunities in a closed pipeline stage", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reminders-closed");
    tenantIds.push(tenantId);
    const customer = await createCustomer(tenantId);
    const closedStage = await prisma.pipelineStage.create({ data: { tenantId, key: "WON", label: "Won", order: 1, isClosed: true, isWon: true } });
    await prisma.opportunity.create({
      data: { tenantId, customerId: customer.id, stageId: closedStage.id, opportunityNo: "OP-R4", requirement: "x", ownerId: user.id, nextFollowUpDate: new Date(Date.now() - 86400000) },
    });

    const result = await runFollowUpReminders(tenantId);
    expect(result.itemsFound).toBe(0);
  });
});
