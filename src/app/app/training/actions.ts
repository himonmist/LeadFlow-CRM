"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function updateTrainingProgram(formData: FormData) {
  const user = await requirePermission("training", "edit");
  const trainingId = String(formData.get("trainingId"));

  const before = await prisma.trainingProgram.findFirst({ where: { id: trainingId, tenantId: user.tenantId } });
  if (!before) return;

  const data = {
    status: (formData.get("status") as any) || before.status,
    trainerId: String(formData.get("trainerId") || "") || undefined,
    deliveryMode: (formData.get("deliveryMode") as any) || before.deliveryMode,
    trainingDate: formData.get("trainingDate") ? new Date(String(formData.get("trainingDate"))) : undefined,
    startTime: String(formData.get("startTime") || "") || undefined,
    endTime: String(formData.get("endTime") || "") || undefined,
    venue: String(formData.get("venue") || "") || undefined,
    meetingLink: String(formData.get("meetingLink") || "") || undefined,
    participants: formData.get("participants") ? Number(formData.get("participants")) : undefined,
    coordinator: String(formData.get("coordinator") || "") || undefined,
    category: String(formData.get("category") || "") || undefined,
    discount: formData.get("discount") ? Number(formData.get("discount")) : undefined,
    tax: formData.get("tax") ? Number(formData.get("tax")) : undefined,
  };

  await prisma.trainingProgram.update({ where: { id: trainingId }, data });

  if (data.status !== before.status) {
    await logAudit({ tenantId: user.tenantId, userId: user.id, action: "STATUS_CHANGE", entityType: "TrainingProgram", entityId: trainingId, before: { status: before.status }, after: { status: data.status } });
  }

  revalidatePath(`/app/training/${trainingId}`);
  revalidatePath("/app/training");
  revalidatePath("/app/calendar");
}
