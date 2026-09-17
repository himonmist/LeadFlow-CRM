"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DASHBOARD_PATH } from "@/lib/permissions";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    const redirectTo = user ? DEFAULT_DASHBOARD_PATH[user.role.name] ?? "/app/dashboard" : "/app/dashboard";

    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}
