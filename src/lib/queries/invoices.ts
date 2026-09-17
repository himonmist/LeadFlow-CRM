import { prisma } from "@/lib/prisma";

export function effectiveInvoiceStatus(invoice: { status: string; dueDate: Date | null; total: number; paidAmount: number }) {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED" || invoice.status === "DRAFT" || invoice.status === "PENDING_APPROVAL") {
    return invoice.status;
  }
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.paidAmount < invoice.total) {
    return "OVERDUE";
  }
  return invoice.status;
}

export async function listInvoices(tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: { customer: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return invoices.map((inv) => ({ ...inv, effectiveStatus: effectiveInvoiceStatus(inv) }));
}

export async function getInvoice(tenantId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { tenantId, id },
    include: { customer: true, opportunity: true, items: true, payments: { orderBy: { paymentDate: "desc" } } },
  });
  if (!invoice) return null;
  return { ...invoice, effectiveStatus: effectiveInvoiceStatus(invoice) };
}

export async function listPayments(tenantId: string) {
  return prisma.payment.findMany({
    where: { tenantId },
    include: { invoice: { include: { customer: true } } },
    orderBy: { paymentDate: "desc" },
  });
}
