"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { generateInvoiceNumber } from "@/lib/numbering";
import { logAudit } from "@/lib/audit";

const INVOICE_APPROVAL_THRESHOLD = 500000;

export async function createInvoice(formData: FormData) {
  const user = await requirePermission("invoice", "create");

  const customerId = String(formData.get("customerId"));
  const opportunityId = String(formData.get("opportunityId") || "") || undefined;
  const items = JSON.parse(String(formData.get("itemsJson") || "[]")) as { description: string; quantity: number; unitPrice: number }[];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discount = Number(formData.get("discount") || 0);
  const tax = Number(formData.get("tax") || 0);
  const total = subtotal - discount + tax;

  const invoiceNo = await generateInvoiceNumber(user.tenantId);
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: user.tenantId,
      invoiceNo,
      customerId,
      opportunityId,
      status: "DRAFT",
      dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : new Date(Date.now() + 15 * 86400000),
      paymentTerms: String(formData.get("paymentTerms") || "") || undefined,
      subtotal,
      discount,
      tax,
      total,
      items: { create: items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
    },
  });

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CREATE", entityType: "Invoice", entityId: invoice.id, after: { invoiceNo, total } });
  revalidatePath("/app/finance/invoices");
  redirect(`/app/finance/invoices/${invoice.id}`);
}

export async function issueInvoice(invoiceId: string) {
  const user = await requirePermission("invoice", "approve");
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId: user.tenantId } });
  if (!invoice) return;

  if (invoice.total > INVOICE_APPROVAL_THRESHOLD) {
    const approved = await prisma.approval.findFirst({ where: { tenantId: user.tenantId, invoiceId, type: "INVOICE", status: "APPROVED" } });
    if (!approved) {
      const pending = await prisma.approval.findFirst({ where: { tenantId: user.tenantId, invoiceId, type: "INVOICE", status: "PENDING" } });
      if (!pending) {
        await prisma.approval.create({
          data: { tenantId: user.tenantId, type: "INVOICE", invoiceId, requestedById: user.id, reason: `Invoice total (${invoice.total}) exceeds the ${INVOICE_APPROVAL_THRESHOLD} auto-approval threshold.` },
        });
      }
      await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PENDING_APPROVAL" } });
      revalidatePath(`/app/finance/invoices/${invoiceId}`);
      return;
    }
  }

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "ISSUED" } });

  const customer = await prisma.customer.findUnique({ where: { id: invoice.customerId } });
  const admin = await prisma.user.findFirst({ where: { tenantId: user.tenantId, role: { name: "FINANCE" } } });
  if (admin) {
    await prisma.notification.create({
      data: { tenantId: user.tenantId, userId: admin.id, type: "INVOICE_GENERATED", title: "Invoice issued", message: `Invoice ${invoice.invoiceNo} issued to ${customer?.name ?? "customer"}.`, link: `/app/finance/invoices/${invoiceId}` },
    });
  }

  revalidatePath(`/app/finance/invoices/${invoiceId}`);
  revalidatePath("/app/finance/invoices");
}

export async function recordPayment(formData: FormData) {
  const user = await requirePermission("payment", "create");
  const invoiceId = String(formData.get("invoiceId"));
  const amount = Number(formData.get("amount"));

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId: user.tenantId } });
  if (!invoice || amount <= 0) return;

  await prisma.payment.create({
    data: {
      tenantId: user.tenantId,
      invoiceId,
      amount,
      paymentDate: formData.get("paymentDate") ? new Date(String(formData.get("paymentDate"))) : new Date(),
      method: String(formData.get("method") || "") || undefined,
      reference: String(formData.get("reference") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
    },
  });

  const newPaidAmount = invoice.paidAmount + amount;
  const newStatus = newPaidAmount >= invoice.total ? "PAID" : "PARTIALLY_PAID";
  await prisma.invoice.update({ where: { id: invoiceId }, data: { paidAmount: newPaidAmount, status: newStatus } });

  const owner = await prisma.opportunity.findFirst({ where: { id: invoice.opportunityId ?? undefined }, select: { ownerId: true } });
  if (owner?.ownerId) {
    await prisma.notification.create({
      data: { tenantId: user.tenantId, userId: owner.ownerId, type: "PAYMENT_RECEIVED", title: "Payment received", message: `Payment of ${amount} received for invoice ${invoice.invoiceNo}.`, link: `/app/finance/invoices/${invoiceId}` },
    });
  }

  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "PAYMENT", entityType: "Invoice", entityId: invoiceId, after: { amount, newStatus } });

  revalidatePath(`/app/finance/invoices/${invoiceId}`);
  revalidatePath("/app/finance/payments");
  revalidatePath("/app/finance/invoices");
}

export async function cancelInvoice(invoiceId: string) {
  const user = await requirePermission("invoice", "cancel");
  await prisma.invoice.update({ where: { id: invoiceId, tenantId: user.tenantId }, data: { status: "CANCELLED" } });
  await logAudit({ tenantId: user.tenantId, userId: user.id, action: "CANCEL", entityType: "Invoice", entityId: invoiceId });
  revalidatePath(`/app/finance/invoices/${invoiceId}`);
}
