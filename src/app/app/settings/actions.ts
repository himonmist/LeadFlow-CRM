"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function updateTenantProfile(formData: FormData) {
  const user = await requirePermission("settings", "edit");
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      name: String(formData.get("name")),
      industry: String(formData.get("industry") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      country: String(formData.get("country") || "") || undefined,
    },
  });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "UPDATE", entityType: "Tenant", entityId: user.tenantId });
  revalidatePath("/app/settings");
}
