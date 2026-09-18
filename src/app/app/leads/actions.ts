"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { generateLeadNumber, generateOpportunityNumber } from "@/lib/numbering";
import { logAudit } from "@/lib/audit";

export async function createLead(formData: FormData) {
  const user = await requirePermission("lead", "create");

  const leadNumber = await generateLeadNumber(user.tenantId);
  const lead = await prisma.lead.create({
    data: {
      tenantId: user.tenantId,
      leadNumber,
      companyName: String(formData.get("companyName")),
      designation: String(formData.get("designation") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      mobile: String(formData.get("mobile") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      industry: String(formData.get("industry") || "") || undefined,
      companySize: String(formData.get("companySize") || "") || undefined,
      country: String(formData.get("country") || "") || undefined,
      city: String(formData.get("city") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      source: (formData.get("source") as any) || "MANUAL",
      businessInterest: (formData.get("businessInterest") as any) || "SERVICE",
      priority: (formData.get("priority") as any) || "MEDIUM",
      estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : undefined,
      ownerId: String(formData.get("ownerId") || "") || user.id,
      notes: String(formData.get("notes") || "") || undefined,
    },
  });

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "Lead", entityId: lead.id, after: { leadNumber } });
  revalidatePath("/app/leads");
  redirect(`/app/leads/${lead.id}`);
}

export async function updateLeadStatus(leadId: string, status: string) {
  const user = await requirePermission("lead", "edit");
  const before = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!before) return;
  await prisma.lead.update({ where: { id: leadId }, data: { status: status as any } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "STATUS_CHANGE", entityType: "Lead", entityId: leadId, before: { status: before.status }, after: { status } });
  revalidatePath(`/app/leads/${leadId}`);
}

export async function assignLeadOwner(leadId: string, ownerId: string) {
  const user = await requirePermission("lead", "assign");
  await prisma.lead.update({ where: { id: leadId, tenantId: user.tenantId }, data: { ownerId } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "ASSIGN", entityType: "Lead", entityId: leadId, after: { ownerId } });
  revalidatePath(`/app/leads/${leadId}`);
}

export async function convertLeadToOpportunity(formData: FormData) {
  const user = await requirePermission("opportunity", "create");
  const leadId = String(formData.get("leadId"));

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId: user.tenantId },
    include: { opportunities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!lead) return;

  // Idempotency guard: a slow network or a double-click can resubmit this
  // same form before the page has re-rendered past the "Convert to
  // Opportunity" card, which would otherwise create a duplicate
  // Opportunity. If this lead was already converted, just go to the
  // opportunity that conversion produced instead of creating another one.
  if (lead.status === "CONVERTED" && lead.opportunities[0]) {
    redirect(`/app/opportunities/${lead.opportunities[0].id}`);
  }

  let customerId = lead.customerId;
  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: user.tenantId,
        name: lead.companyName,
        industry: lead.industry,
        website: lead.website,
        country: lead.country,
        city: lead.city,
        address: lead.address,
      },
    });
    customerId = customer.id;

    let contactId: string | undefined;
    if (lead.email || lead.mobile) {
      const contact = await prisma.contact.create({
        data: {
          tenantId: user.tenantId,
          customerId: customer.id,
          name: lead.companyName + " Contact",
          designation: lead.designation,
          email: lead.email,
          phone: lead.mobile,
          isPrimary: true,
        },
      });
      contactId = contact.id;
    }

    await prisma.lead.update({ where: { id: lead.id }, data: { customerId, contactId } });
  }

  const stage = await prisma.pipelineStage.findFirst({ where: { tenantId: user.tenantId, key: "NEW" } });
  const opportunityNo = await generateOpportunityNumber(user.tenantId);

  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: user.tenantId,
      opportunityNo,
      customerId: customerId!,
      leadId: lead.id,
      requirement: String(formData.get("requirement") || lead.notes || "Requirement to be defined"),
      engagementType: (formData.get("engagementType") as any) || "SERVICE",
      programName: String(formData.get("programName") || "") || undefined,
      estimatedValue: Number(formData.get("estimatedValue") || lead.estimatedValue || 0),
      probability: 20,
      ownerId: lead.ownerId,
      stageId: stage!.id,
      priority: lead.priority,
      nextAction: "Initial discovery call",
      nextFollowUpDate: new Date(Date.now() + 3 * 86400000),
    },
  });

  await prisma.lead.update({ where: { id: lead.id }, data: { status: "CONVERTED" } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CONVERT", entityType: "Lead", entityId: lead.id, after: { opportunityId: opportunity.id } });

  revalidatePath("/app/leads");
  redirect(`/app/opportunities/${opportunity.id}`);
}
