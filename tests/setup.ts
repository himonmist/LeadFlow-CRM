import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env" });

// Server actions call these; outside of a real Next.js request there is no
// router to revalidate or redirect through, so tests stub them out. Tests
// that care whether `redirect()` was called assert against this mock.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
