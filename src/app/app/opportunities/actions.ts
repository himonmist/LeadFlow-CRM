"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const HIGH_VALUE_THRESHOLD = 500000;

export async function moveOpportunityStage(opportunityId: string, stageId: string) {
  const user = await requirePermission("opportunity", "edit");

  const [opportunity, targetStage] = await Promise.all([
    prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: user.tenantId }, include: { stage: true, service: true, training: true } }),
    prisma.pipelineStage.findFirst({ where: { id: stageId, tenantId: user.tenantId } }),
  ]);
  if (!opportunity || !targetStage) return { error: "Not found" };

  if (targetStage.isWon && opportunity.estimatedValue > HIGH_VALUE_THRESHOLD) {
    const approved = await prisma.approval.findFirst({
      where: { tenantId: user.tenantId, opportunityId, type: "HIGH_VALUE_OPPORTUNITY", status: "APPROVED" },
    });
    if (!approved) {
      const existingPending = await prisma.approval.findFirst({
        where: { tenantId: user.tenantId, opportunityId, type: "HIGH_VALUE_OPPORTUNITY", status: "PENDING" },
      });
      if (!existingPending) {
        await prisma.approval.create({
          data: {
            tenantId: user.tenantId,
            type: "HIGH_VALUE_OPPORTUNITY",
            opportunityId,
            requestedById: user.id,
            reason: `Opportunity value (${opportunity.estimatedValue}) exceeds the ${HIGH_VALUE_THRESHOLD} auto-approval threshold.`,
          },
        });
      }
      revalidatePath(`/app/opportunities/${opportunityId}`);
      return { error: "High-value deal requires manager approval before it can be marked Won. A request has been sent." };
    }
  }

  await prisma.opportunity.update({ where: { id: opportunityId }, data: { stageId } });

  if (targetStage.isWon && !opportunity.service && !opportunity.training) {
    if (opportunity.engagementType === "SERVICE") {
      await prisma.service.create({
        data: {
          tenantId: user.tenantId,
          opportunityId,
          customerId: opportunity.customerId,
          name: opportunity.programName ?? opportunity.requirement,
          value: opportunity.estimatedValue,
          status: "SCHEDULED",
        },
      });
    } else {
      await prisma.trainingProgram.create({
        data: {
          tenantId: user.tenantId,
          opportunityId,
          customerId: opportunity.customerId,
          programName: opportunity.programName ?? opportunity.requirement,
          fee: opportunity.estimatedValue,
          status: "SCHEDULED",
        },
      });
    }
  }

  await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "Opportunity",
    entityId: opportunityId,
    before: { stage: opportunity.stage.key },
    after: { stage: targetStage.key },
  });

  revalidatePath("/app/pipeline");
  revalidatePath("/app/opportunities");
  revalidatePath(`/app/opportunities/${opportunityId}`);
  return { success: true };
}

export async function updateOpportunityNextAction(formData: FormData) {
  const user = await requirePermission("opportunity", "edit");
  const opportunityId = String(formData.get("opportunityId"));

  await prisma.opportunity.update({
    where: { id: opportunityId, tenantId: user.tenantId },
    data: {
      nextAction: String(formData.get("nextAction") || "") || undefined,
      nextFollowUpDate: formData.get("nextFollowUpDate") ? new Date(String(formData.get("nextFollowUpDate"))) : undefined,
      probability: formData.get("probability") ? Number(formData.get("probability")) : undefined,
    },
  });

  revalidatePath(`/app/opportunities/${opportunityId}`);
}

export async function updateOpportunityDetails(formData: FormData) {
  const user = await requirePermission("opportunity", "edit");
  const opportunityId = String(formData.get("opportunityId"));

  const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: user.tenantId } });
  if (!opportunity) return;

  const programName = String(formData.get("programName") || "") || null;
  const requirement = String(formData.get("requirement") || "");
  const estimatedValue = Number(formData.get("estimatedValue") || 0);
  const priority = String(formData.get("priority") || opportunity.priority) as "LOW" | "MEDIUM" | "HIGH";

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { programName, requirement, estimatedValue, priority },
  });

  await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "UPDATE",
    entityType: "Opportunity",
    entityId: opportunityId,
    before: { programName: opportunity.programName, requirement: opportunity.requirement, estimatedValue: opportunity.estimatedValue, priority: opportunity.priority },
    after: { programName, requirement, estimatedValue, priority },
  });

  revalidatePath(`/app/opportunities/${opportunityId}`);
  revalidatePath("/app/opportunities");
}

export async function markLostOrPostponed(opportunityId: string, key: "LOST" | "POSTPONED" | "CANCELLED", reason?: string) {
  const user = await requirePermission("opportunity", "cancel");
  const stage = await prisma.pipelineStage.findFirst({ where: { tenantId: user.tenantId, key } });
  if (!stage) return;
  await prisma.opportunity.update({ where: { id: opportunityId, tenantId: user.tenantId }, data: { stageId: stage.id, lostReason: reason } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "STATUS_CHANGE", entityType: "Opportunity", entityId: opportunityId, after: { stage: key, reason } });
  revalidatePath(`/app/opportunities/${opportunityId}`);
  revalidatePath("/app/pipeline");
}
