import { prisma } from "@/lib/prisma";

async function nextSequence(tenantId: string, prefix: string, counter: () => Promise<number>) {
  const count = await counter();
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export const generateLeadNumber = (tenantId: string) =>
  nextSequence(tenantId, "LD", () => prisma.lead.count({ where: { tenantId } }));

export const generateOpportunityNumber = (tenantId: string) =>
  nextSequence(tenantId, "OP", () => prisma.opportunity.count({ where: { tenantId } }));

export const generateQuotationNumber = (tenantId: string) =>
  nextSequence(tenantId, "QT", () => prisma.quotation.count({ where: { tenantId } }));

export const generateInvoiceNumber = (tenantId: string) =>
  nextSequence(tenantId, "INV", () => prisma.invoice.count({ where: { tenantId } }));
