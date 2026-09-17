"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function setTenantStatus(tenantId: string, status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED") {
  await requireSuperAdmin();
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });
  await logAudit({ tenantId, action: "STATUS_CHANGE", entityType: "Tenant", entityId: tenantId, after: { status } });
  revalidatePath("/super-admin");
}
