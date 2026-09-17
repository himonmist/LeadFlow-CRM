"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function updateService(formData: FormData) {
  const user = await requirePermission("service", "edit");
  const serviceId = String(formData.get("serviceId"));

  const before = await prisma.service.findFirst({ where: { id: serviceId, tenantId: user.tenantId } });
  if (!before) return;

  const data = {
    status: (formData.get("status") as any) || before.status,
    startDate: formData.get("startDate") ? new Date(String(formData.get("startDate"))) : undefined,
    expectedDeliveryDate: formData.get("expectedDeliveryDate") ? new Date(String(formData.get("expectedDeliveryDate"))) : undefined,
    actualDeliveryDate: formData.get("actualDeliveryDate") ? new Date(String(formData.get("actualDeliveryDate"))) : undefined,
    assignedTeam: String(formData.get("assignedTeam") || "") || undefined,
    category: String(formData.get("category") || "") || undefined,
    description: String(formData.get("description") || "") || undefined,
    paymentTerms: String(formData.get("paymentTerms") || "") || undefined,
    discount: formData.get("discount") ? Number(formData.get("discount")) : undefined,
    tax: formData.get("tax") ? Number(formData.get("tax")) : undefined,
  };

  await prisma.service.update({ where: { id: serviceId }, data });

  if (data.status !== before.status) {
    await logAudit({ tenantId: user.tenantId, userId: user.id, action: "STATUS_CHANGE", entityType: "Service", entityId: serviceId, before: { status: before.status }, after: { status: data.status } });
  }

  revalidatePath(`/app/services/${serviceId}`);
  revalidatePath("/app/services");
}
