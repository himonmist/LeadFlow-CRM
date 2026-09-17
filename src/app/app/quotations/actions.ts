"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { generateQuotationNumber } from "@/lib/numbering";
import { logAudit } from "@/lib/audit";

const DISCOUNT_APPROVAL_THRESHOLD_PCT = 15;

type Item = { description: string; quantity: number; unitPrice: number };

export async function createQuotation(formData: FormData) {
  const user = await requirePermission("quotation", "create");

  const customerId = String(formData.get("customerId"));
  const opportunityId = String(formData.get("opportunityId") || "") || undefined;
  const items: Item[] = JSON.parse(String(formData.get("itemsJson") || "[]"));
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discount = Number(formData.get("discount") || 0);
  const tax = Number(formData.get("tax") || 0);
  const total = subtotal - discount + tax;

  const discountPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
  const needsApproval = discountPct > DISCOUNT_APPROVAL_THRESHOLD_PCT;

  const quotationNo = await generateQuotationNumber(user.tenantId);
  const quotation = await prisma.quotation.create({
    data: {
      tenantId: user.tenantId,
      quotationNo,
      customerId,
      opportunityId,
      status: needsApproval ? "DRAFT" : "SENT",
      validUntil: formData.get("validUntil") ? new Date(String(formData.get("validUntil"))) : undefined,
      terms: String(formData.get("terms") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
      subtotal,
      discount,
      tax,
      total,
      items: { create: items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
    },
  });

  if (needsApproval) {
    await prisma.approval.create({
      data: {
        tenantId: user.tenantId,
        type: "DISCOUNT",
        quotationId: quotation.id,
        opportunityId,
        requestedById: user.id,
        reason: `Discount of ${discountPct.toFixed(1)}% exceeds the ${DISCOUNT_APPROVAL_THRESHOLD_PCT}% auto-approval threshold.`,
      },
    });
  }

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "Quotation", entityId: quotation.id, after: { quotationNo, total } });

  revalidatePath("/app/quotations");
  if (opportunityId) revalidatePath(`/app/opportunities/${opportunityId}`);
  redirect(`/app/quotations/${quotation.id}`);
}

export async function sendQuotation(quotationId: string) {
  const user = await requirePermission("quotation", "edit");
  await prisma.quotation.update({ where: { id: quotationId, tenantId: user.tenantId }, data: { status: "SENT" } });
  revalidatePath(`/app/quotations/${quotationId}`);
}

export async function generateInvoiceFromQuotation(quotationId: string) {
  const user = await requirePermission("invoice", "create");
  const { generateInvoiceNumber } = await import("@/lib/numbering");

  const quotation = await prisma.quotation.findFirst({ where: { id: quotationId, tenantId: user.tenantId }, include: { items: true } });
  if (!quotation) return;

  const invoiceNo = await generateInvoiceNumber(user.tenantId);
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: user.tenantId,
      invoiceNo,
      customerId: quotation.customerId,
      opportunityId: quotation.opportunityId,
      quotationId: quotation.id,
      status: "DRAFT",
      dueDate: new Date(Date.now() + 15 * 86400000),
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      tax: quotation.tax,
      total: quotation.total,
      items: { create: quotation.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) },
    },
  });

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "Invoice", entityId: invoice.id, after: { invoiceNo } });
  revalidatePath("/app/finance/invoices");
  redirect(`/app/finance/invoices/${invoice.id}`);
}
