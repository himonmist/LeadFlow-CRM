import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createTenantWithAdmin } from "./fixtures";

const { sendTenantEmailMock } = vi.hoisted(() => ({ sendTenantEmailMock: vi.fn().mockResolvedValue({ sent: true }) }));
vi.mock("@/lib/email", () => ({ sendTenantEmail: sendTenantEmailMock }));

import { requestPasswordReset, resetPassword } from "@/app/(auth)/forgot-password/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function extractToken(html: string): string {
  const match = html.match(/\/reset-password\/([a-f0-9]+)/);
  if (!match) throw new Error("No reset token found in email body");
  return match[1];
}

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

describe("forgot / reset password", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  beforeEach(() => {
    sendTenantEmailMock.mockClear();
  });

  it("reports submitted:true even for an email that doesn't exist (no user enumeration)", async () => {
    const result = await requestPasswordReset({}, formData({ email: "nobody@nowhere.test" }));
    expect(result.submitted).toBe(true);
    expect(sendTenantEmailMock).not.toHaveBeenCalled();
  });

  it("emails a working reset link, and the link lets the user set a new password", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reset-flow");
    tenantIds.push(tenantId);

    const requestResult = await requestPasswordReset({}, formData({ email: user.email }));
    expect(requestResult.submitted).toBe(true);
    expect(sendTenantEmailMock).toHaveBeenCalledTimes(1);
    const rawToken = extractToken(sendTenantEmailMock.mock.calls[0][1].html);

    const resetResult = await resetPassword({}, formData({ token: rawToken, newPassword: "BrandNewPass1", confirmPassword: "BrandNewPass1" }));
    expect(resetResult.success).toBe(true);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("BrandNewPass1", updated.passwordHash)).toBe(true);
  });

  it("rejects reusing an already-used token", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reset-reuse");
    tenantIds.push(tenantId);

    await requestPasswordReset({}, formData({ email: user.email }));
    const rawToken = extractToken(sendTenantEmailMock.mock.calls[0][1].html);

    await resetPassword({}, formData({ token: rawToken, newPassword: "FirstPass123", confirmPassword: "FirstPass123" }));
    const secondAttempt = await resetPassword({}, formData({ token: rawToken, newPassword: "SecondPass123", confirmPassword: "SecondPass123" }));

    expect(secondAttempt.error).toBeTruthy();
    const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("FirstPass123", finalUser.passwordHash)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const { tenantId, user } = await createTenantWithAdmin("reset-expired");
    tenantIds.push(tenantId);

    const rawToken = `expired-token-${randomUUID()}`;
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await resetPassword({}, formData({ token: rawToken, newPassword: "WontWork123", confirmPassword: "WontWork123" }));
    expect(result.error).toBeTruthy();
  });

  it("rejects an unknown token", async () => {
    const result = await resetPassword({}, formData({ token: "not-a-real-token", newPassword: "WontWork123", confirmPassword: "WontWork123" }));
    expect(result.error).toBeTruthy();
  });

  it("rejects mismatched confirmation before touching the token", async () => {
    const result = await resetPassword({}, formData({ token: "irrelevant", newPassword: "abcdefgh", confirmPassword: "different" }));
    expect(result.error).toMatch(/match/i);
  });
});
