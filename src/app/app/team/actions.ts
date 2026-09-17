"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function inviteTeamMember(formData: FormData) {
  const user = await requirePermission("user", "create");

  const email = String(formData.get("email")).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const roleName = String(formData.get("roleName"));
  const role = await prisma.role.findFirst({ where: { tenantId: null, name: roleName as any } });
  if (!role) return;

  const tempPassword = "Welcome123!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      tenantId: user.tenantId,
      name: String(formData.get("name")),
      email,
      passwordHash,
      roleId: role.id,
      title: String(formData.get("title") || "") || undefined,
    },
  });

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "User", entityId: newUser.id, after: { email } });
  revalidatePath("/app/team");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const user = await requirePermission("user", "edit");
  await prisma.user.update({ where: { id: userId, tenantId: user.tenantId }, data: { isActive } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: isActive ? "ACTIVATE" : "DEACTIVATE", entityType: "User", entityId: userId });
  revalidatePath("/app/team");
}
