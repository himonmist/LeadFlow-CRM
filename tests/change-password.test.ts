import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createTenantWithAdmin } from "./fixtures";
import { sessionState } from "./session-mock";

vi.mock("@/lib/session", () => import("./session-mock"));

const { sendTenantEmailMock } = vi.hoisted(() => ({ sendTenantEmailMock: vi.fn().mockResolvedValue({ sent: true }) }));
vi.mock("@/lib/email", () => ({ sendTenantEmail: sendTenantEmailMock }));

import { changePassword } from "@/app/app/settings/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("changePassword", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  beforeEach(() => {
    sendTenantEmailMock.mockClear();
  });

  it("updates the password and emails a confirmation when the current password is correct", async () => {
    const { tenantId, user } = await createTenantWithAdmin("changepw-ok");
    tenantIds.push(tenantId);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash("OldPassword1", 10) } });
    sessionState.user = user;

    const result = await changePassword({}, formData({ currentPassword: "OldPassword1", newPassword: "NewPassword2", confirmPassword: "NewPassword2" }));

    expect(result.success).toBeTruthy();
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("NewPassword2", updated.passwordHash)).toBe(true);
    expect(sendTenantEmailMock).toHaveBeenCalledTimes(1);
    expect(sendTenantEmailMock.mock.calls[0][1].to).toBe(user.email);
  });

  it("rejects an incorrect current password and leaves the hash unchanged", async () => {
    const { tenantId, user } = await createTenantWithAdmin("changepw-wrong");
    tenantIds.push(tenantId);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash("OldPassword1", 10) } });
    sessionState.user = user;

    const result = await changePassword({}, formData({ currentPassword: "WrongPassword", newPassword: "NewPassword2", confirmPassword: "NewPassword2" }));

    expect(result.error).toBeTruthy();
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("OldPassword1", unchanged.passwordHash)).toBe(true);
    expect(sendTenantEmailMock).not.toHaveBeenCalled();
  });

  it("rejects a new password that doesn't match its confirmation", async () => {
    const { tenantId, user } = await createTenantWithAdmin("changepw-mismatch");
    tenantIds.push(tenantId);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash("OldPassword1", 10) } });
    sessionState.user = user;

    const result = await changePassword({}, formData({ currentPassword: "OldPassword1", newPassword: "NewPassword2", confirmPassword: "Different3" }));
    expect(result.error).toMatch(/match/i);
  });

  it("rejects a new password shorter than 8 characters", async () => {
    const { tenantId, user } = await createTenantWithAdmin("changepw-short");
    tenantIds.push(tenantId);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash("OldPassword1", 10) } });
    sessionState.user = user;

    const result = await changePassword({}, formData({ currentPassword: "OldPassword1", newPassword: "short", confirmPassword: "short" }));
    expect(result.error).toBeTruthy();
  });
});
