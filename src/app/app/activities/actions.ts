"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function logActivity(formData: FormData) {
  const user = await requirePermission("activity", "create");

  const leadId = String(formData.get("leadId") || "") || undefined;
  const opportunityId = String(formData.get("opportunityId") || "") || undefined;
  const customerId = String(formData.get("customerId") || "") || undefined;
  const nextFollowUpDate = formData.get("nextFollowUpDate") ? new Date(String(formData.get("nextFollowUpDate"))) : undefined;

  const activity = await prisma.activity.create({
    data: {
      tenantId: user.tenantId,
      type: (formData.get("type") as any) || "OTHER",
      date: formData.get("date") ? new Date(String(formData.get("date"))) : new Date(),
      startTime: String(formData.get("startTime") || "") || undefined,
      endTime: String(formData.get("endTime") || "") || undefined,
      subject: String(formData.get("subject") || "Activity"),
      description: String(formData.get("description") || "") || undefined,
      outcome: String(formData.get("outcome") || "") || undefined,
      status: (formData.get("status") as any) || "COMPLETED",
      leadId,
      opportunityId,
      customerId,
      assignedToId: String(formData.get("assignedToId") || "") || user.id,
      nextAction: String(formData.get("nextAction") || "") || undefined,
      nextFollowUpDate,
      internalNote: String(formData.get("internalNote") || "") || undefined,
    },
  });

  if (opportunityId && (formData.get("nextAction") || nextFollowUpDate)) {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        nextAction: String(formData.get("nextAction") || "") || undefined,
        nextFollowUpDate,
      },
    });
  }

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "Activity", entityId: activity.id });

  const returnTo = String(formData.get("returnTo") || "/app/calendar");
  revalidatePath(returnTo);
}
