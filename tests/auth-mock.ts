import { vi } from "vitest";
import type { MockSessionUser } from "./session-mock";

/** Mocks next-auth's `auth()` only — `requirePermission`/`requireTenantSession`
 * from `@/lib/session` run for real against this, so the actual `can()`
 * permission check executes exactly as it does in production. Use this
 * instead of `session-mock.ts` whenever a test needs to verify that a role
 * without a permission is actually blocked, not just simulate an
 * always-allowed caller. */
export const authState: { session: { user: MockSessionUser } | null } = { session: null };

export const auth = vi.fn(async () => authState.session);
