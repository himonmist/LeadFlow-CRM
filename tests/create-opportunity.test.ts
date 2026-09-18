import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createCustomer, createTenantWithAdmin } from "./fixtures";
import { sessionState } from "./session-mock";

vi.mock("@/lib/session", () => import("./session-mock"));

import { createOpportunity } from "@/app/app/opportunities/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function redirectPath(err: unknown): string {
  if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT:")) return err.message.slice("NEXT_REDIRECT:".length);
  throw err;
}

describe("createOpportunity", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  it("adds a second, independent opportunity to a customer that already has one", async () => {
    const { tenantId, user } = await createTenantWithAdmin("add-opportunity");
    tenantIds.push(tenantId);
    sessionState.user = user;

    await prisma.pipelineStage.create({ data: { tenantId, key: "NEW", label: "New", order: 0 } });
    const wonStage = await prisma.pipelineStage.create({ data: { tenantId, key: "WON", label: "Won", order: 1, isClosed: true, isWon: true } });
    const customer = await createCustomer(tenantId, "Renata Limited");

    const first = await prisma.opportunity.create({
      data: {
        tenantId,
        customerId: customer.id,
        stageId: wonStage.id,
        opportunityNo: "OP-0001",
        requirement: "AI Training for Haematology Doctors",
        engagementType: "TRAINING",
        estimatedValue: 75000,
      },
    });

    const secondRedirect = redirectPath(
      await createOpportunity(
        formData({
          customerId: customer.id,
          requirement: "AI Training for Oncology Doctors",
          engagementType: "TRAINING",
          programName: "AI Training for Oncology Doctors",
          estimatedValue: "75000",
        }),
      ).catch((e) => e),
    );

    const opportunities = await prisma.opportunity.findMany({ where: { tenantId, customerId: customer.id } });
    expect(opportunities).toHaveLength(2);

    // The first opportunity is untouched — adding a second one never
    // merges into or overwrites an existing opportunity for the customer.
    const untouchedFirst = await prisma.opportunity.findUniqueOrThrow({ where: { id: first.id } });
    expect(untouchedFirst.stageId).toBe(wonStage.id);
    expect(untouchedFirst.requirement).toBe("AI Training for Haematology Doctors");

    const second = opportunities.find((o) => o.id !== first.id)!;
    expect(second.programName).toBe("AI Training for Oncology Doctors");
    expect(second.stageId).not.toBe(wonStage.id);
    expect(secondRedirect).toBe(`/app/opportunities/${second.id}`);
  });

  it("never attaches a new opportunity to another tenant's customer", async () => {
    const owner = await createTenantWithAdmin("opp-owner");
    const attacker = await createTenantWithAdmin("opp-attacker");
    tenantIds.push(owner.tenantId, attacker.tenantId);

    const customer = await createCustomer(owner.tenantId);
    sessionState.user = attacker.user;

    await createOpportunity(formData({ customerId: customer.id, requirement: "Should not be created", estimatedValue: "1000" }));

    const opportunities = await prisma.opportunity.findMany({ where: { customerId: customer.id } });
    expect(opportunities).toHaveLength(0);
  });
});
