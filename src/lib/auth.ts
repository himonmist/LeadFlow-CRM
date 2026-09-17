import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { PermissionMatrix } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tenantId: string | null;
      tenantName: string | null;
      tenantSlug: string | null;
      roleName: string;
      roleLabel: string;
      permissions: PermissionMatrix;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { role: true, tenant: true },
        });
        if (!user || !user.isActive || user.deletedAt) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name ?? null,
          tenantSlug: user.tenant?.slug ?? null,
          roleName: user.role.name,
          roleLabel: user.role.label,
          permissions: user.role.permissions as PermissionMatrix,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        Object.assign(token, {
          id: user.id,
          tenantId: (user as any).tenantId,
          tenantName: (user as any).tenantName,
          tenantSlug: (user as any).tenantSlug,
          roleName: (user as any).roleName,
          roleLabel: (user as any).roleLabel,
          permissions: (user as any).permissions,
        });
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string | null;
      session.user.tenantName = token.tenantName as string | null;
      session.user.tenantSlug = token.tenantSlug as string | null;
      session.user.roleName = token.roleName as string;
      session.user.roleLabel = token.roleLabel as string;
      session.user.permissions = token.permissions as PermissionMatrix;
      return session;
    },
  },
});
