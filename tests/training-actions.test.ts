import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  cleanupTenant,
  createCustomer,
  createOpportunity,
  createTenantWithAdmin,
  createTrainer,
  createTrainingProgram,
  createWonStage,
} from "./fixtures";
import { sessionState } from "./session-mock";

vi.mock("@/lib/session", () => import("./session-mock"));

import { updateTrainingProgram } from "@/app/app/training/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("updateTrainingProgram", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  it("saves training date, start/end time, and trainer from an unscheduled program", async () => {
    // Regression test for the reported bug: a newly-created training program
    // (auto-generated when an opportunity is marked Won) starts with no
    // schedule. Filling in the schedule form and saving must persist all of
    // it, including the assigned trainer.
    const { tenantId, user } = await createTenantWithAdmin("training-save");
    tenantIds.push(tenantId);
    sessionState.user = user;

    const customer = await createCustomer(tenantId);
    const stage = await createWonStage(tenantId);
    const opportunity = await createOpportunity(tenantId, customer.id, stage.id);
    const training = await createTrainingProgram(tenantId, opportunity.id, customer.id);
    const trainer = await createTrainer(tenantId);

    expect(training.trainingDate).toBeNull();
    expect(training.startTime).toBeNull();
    expect(training.trainerId).toBeNull();

    await updateTrainingProgram(
      formData({
        trainingId: training.id,
        trainingDate: "2026-11-20",
        startTime: "10:30",
        endTime: "13:00",
        trainerId: trainer.id,
        deliveryMode: "PHYSICAL",
      }),
    );

    const updated = await prisma.trainingProgram.findUniqueOrThrow({ where: { id: training.id } });
    expect(updated.trainingDate?.toISOString().slice(0, 10)).toBe("2026-11-20");
    expect(updated.startTime).toBe("10:30");
    expect(updated.endTime).toBe("13:00");
    expect(updated.trainerId).toBe(trainer.id);
  });

  it("never updates a training program belonging to a different tenant", async () => {
    const owner = await createTenantWithAdmin("training-owner");
    const attacker = await createTenantWithAdmin("training-attacker");
    tenantIds.push(owner.tenantId, attacker.tenantId);

    const customer = await createCustomer(owner.tenantId);
    const stage = await createWonStage(owner.tenantId);
    const opportunity = await createOpportunity(owner.tenantId, customer.id, stage.id);
    const training = await createTrainingProgram(owner.tenantId, opportunity.id, customer.id);

    // Attacker's session is active, but they target the victim tenant's
    // training program by id.
    sessionState.user = attacker.user;

    await updateTrainingProgram(
      formData({ trainingId: training.id, trainingDate: "2099-01-01", startTime: "09:00", endTime: "10:00" }),
    );

    const unchanged = await prisma.trainingProgram.findUniqueOrThrow({ where: { id: training.id } });
    expect(unchanged.trainingDate).toBeNull();
    expect(unchanged.startTime).toBeNull();
  });
});
