import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createCustomer, createOpportunity, createTenantWithAdmin, createTrainingProgram, createUserWithRole, createWonStage } from "./fixtures";
import { authState } from "./auth-mock";

// Unlike the other test files, this one does NOT mock @/lib/session — it
// mocks next-auth's auth() and lets the real requirePermission()/can()
// checks run. The other suites always let requirePermission succeed, which
// is why they could never have caught this bug: a Marketing Executive's
// role has only VIEW on training/service, but the schedule form let them
// submit anyway, and the server-side rejection was completely silent.
vi.mock("@/lib/auth", () => import("./auth-mock"));

import { updateTrainingProgram } from "@/app/app/training/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("real permission enforcement for training schedule edits", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  it("blocks a Marketing Executive and redirects to the dashboard with ?denied=1, without changing the record", async () => {
    const { tenantId } = await createTenantWithAdmin("perm-marketing");
    tenantIds.push(tenantId);
    const marketingUser = await createUserWithRole(tenantId, "MARKETING");
    authState.session = { user: marketingUser };

    const customer = await createCustomer(tenantId);
    const stage = await createWonStage(tenantId);
    const opportunity = await createOpportunity(tenantId, customer.id, stage.id);
    const training = await createTrainingProgram(tenantId, opportunity.id, customer.id);

    await expect(
      updateTrainingProgram(formData({ trainingId: training.id, trainingDate: "2026-12-01", startTime: "09:00", endTime: "10:00" })),
    ).rejects.toThrow("NEXT_REDIRECT:/app/dashboard?denied=1");

    const unchanged = await prisma.trainingProgram.findUniqueOrThrow({ where: { id: training.id } });
    expect(unchanged.trainingDate).toBeNull();
  });

  it("allows an Admin to edit the same schedule", async () => {
    const { tenantId, user } = await createTenantWithAdmin("perm-admin");
    tenantIds.push(tenantId);
    authState.session = { user };

    const customer = await createCustomer(tenantId);
    const stage = await createWonStage(tenantId);
    const opportunity = await createOpportunity(tenantId, customer.id, stage.id);
    const training = await createTrainingProgram(tenantId, opportunity.id, customer.id);

    await updateTrainingProgram(formData({ trainingId: training.id, trainingDate: "2026-12-01", startTime: "09:00", endTime: "10:00" }));

    const updated = await prisma.trainingProgram.findUniqueOrThrow({ where: { id: training.id } });
    expect(updated.trainingDate?.toISOString().slice(0, 10)).toBe("2026-12-01");
  });

  it("allows a Trainer to edit the schedule too", async () => {
    const { tenantId } = await createTenantWithAdmin("perm-trainer");
    tenantIds.push(tenantId);
    const trainerUser = await createUserWithRole(tenantId, "TRAINER");
    authState.session = { user: trainerUser };

    const customer = await createCustomer(tenantId);
    const stage = await createWonStage(tenantId);
    const opportunity = await createOpportunity(tenantId, customer.id, stage.id);
    const training = await createTrainingProgram(tenantId, opportunity.id, customer.id);

    await updateTrainingProgram(formData({ trainingId: training.id, trainingDate: "2026-12-01", startTime: "09:00", endTime: "10:00" }));

    const updated = await prisma.trainingProgram.findUniqueOrThrow({ where: { id: training.id } });
    expect(updated.trainingDate?.toISOString().slice(0, 10)).toBe("2026-12-01");
  });
});
