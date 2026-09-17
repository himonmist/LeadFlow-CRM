"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function reviewApproval(formData: FormData) {
  const user = await requirePermission("approval", "approve");
  const approvalId = String(formData.get("approvalId"));
  const decision = String(formData.get("decision")) as "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  const reviewComment = String(formData.get("reviewComment") || "") || undefined;

  const approval = await prisma.approval.update({
    where: { id: approvalId, tenantId: user.tenantId },
    data: { status: decision, reviewedById: user.id, reviewComment },
  });

  if (approval.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({ where: { id: approval.opportunityId } });
    if (opportunity && approval.type === "HIGH_VALUE_OPPORTUNITY" && decision === "APPROVED") {
      const wonStage = await prisma.pipelineStage.findFirst({ where: { tenantId: user.tenantId, isWon: true } });
      if (wonStage) {
        await prisma.opportunity.update({ where: { id: opportunity.id }, data: { stageId: wonStage.id } });
        const existingFulfillment = await Promise.all([
          prisma.service.findUnique({ where: { opportunityId: opportunity.id } }),
          prisma.trainingProgram.findUnique({ where: { opportunityId: opportunity.id } }),
        ]);
        if (!existingFulfillment[0] && !existingFulfillment[1]) {
          if (opportunity.engagementType === "SERVICE") {
            await prisma.service.create({
              data: { tenantId: user.tenantId, opportunityId: opportunity.id, customerId: opportunity.customerId, name: opportunity.programName ?? opportunity.requirement, value: opportunity.estimatedValue, status: "SCHEDULED" },
            });
          } else {
            await prisma.trainingProgram.create({
              data: { tenantId: user.tenantId, opportunityId: opportunity.id, customerId: opportunity.customerId, programName: opportunity.programName ?? opportunity.requirement, fee: opportunity.estimatedValue, status: "SCHEDULED" },
            });
          }
        }
      }
    }
  }
  if (approval.quotationId && decision === "APPROVED") {
    await prisma.quotation.update({ where: { id: approval.quotationId }, data: { status: "APPROVED" } });
  }
  if (approval.invoiceId && decision === "APPROVED") {
    await prisma.invoice.update({ where: { id: approval.invoiceId }, data: { status: "ISSUED" } });
  }

  await prisma.notification.create({
    data: {
      tenantId: user.tenantId,
      userId: approval.requestedById,
      type: "APPROVAL_RESULT",
      title: `Approval ${decision.toLowerCase().replace("_", " ")}`,
      message: reviewComment ?? `Your ${approval.type.replace(/_/g, " ").toLowerCase()} request was ${decision.toLowerCase().replace("_", " ")}.`,
      link: approval.opportunityId ? `/app/opportunities/${approval.opportunityId}` : "/app/approvals",
    },
  });

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "APPROVAL", entityType: "Approval", entityId: approvalId, after: { status: decision } });

  revalidatePath("/app/approvals");
  if (approval.opportunityId) revalidatePath(`/app/opportunities/${approval.opportunityId}`);
}
