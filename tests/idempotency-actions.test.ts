import { afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { cleanupTenant, createCustomer, createOpportunity, createQuotation, createTenantWithAdmin, createWonStage } from "./fixtures";
import { sessionState } from "./session-mock";

vi.mock("@/lib/session", () => import("./session-mock"));

import { convertLeadToOpportunity } from "@/app/app/leads/actions";
import { generateInvoiceFromQuotation } from "@/app/app/quotations/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function redirectPath(err: unknown): string {
  if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT:")) return err.message.slice("NEXT_REDIRECT:".length);
  throw err;
}

describe("double-submit idempotency guards", () => {
  const tenantIds: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
  });

  it("convertLeadToOpportunity does not create a second Opportunity when resubmitted", async () => {
    const { tenantId, user } = await createTenantWithAdmin("lead-convert");
    tenantIds.push(tenantId);
    sessionState.user = user;

    await prisma.pipelineStage.create({ data: { tenantId, key: "NEW", label: "New", order: 0 } });
    const lead = await prisma.lead.create({
      data: { tenantId, leadNumber: `LD-TEST-${randomUUID().slice(0, 8)}`, companyName: "Acme Pharma", estimatedValue: 5000 },
    });

    const fd = formData({ leadId: lead.id, requirement: "AI training", engagementType: "TRAINING", estimatedValue: "5000" });

    const firstRedirect = redirectPath(await convertLeadToOpportunity(fd).catch((e) => e));
    const secondRedirect = redirectPath(await convertLeadToOpportunity(fd).catch((e) => e));

    expect(firstRedirect).toBe(secondRedirect);

    const opportunities = await prisma.opportunity.findMany({ where: { tenantId, leadId: lead.id } });
    expect(opportunities).toHaveLength(1);
  });

  it("generateInvoiceFromQuotation does not create a second Invoice when resubmitted", async () => {
    const { tenantId, user } = await createTenantWithAdmin("quote-invoice");
    tenantIds.push(tenantId);
    sessionState.user = user;

    const customer = await createCustomer(tenantId);
    const stage = await createWonStage(tenantId);
    const opportunity = await createOpportunity(tenantId, customer.id, stage.id);
    const quotation = await createQuotation(tenantId, customer.id, opportunity.id, "SENT");

    const firstRedirect = redirectPath(await generateInvoiceFromQuotation(quotation.id).catch((e) => e));
    const secondRedirect = redirectPath(await generateInvoiceFromQuotation(quotation.id).catch((e) => e));

    expect(firstRedirect).toBe(secondRedirect);

    const invoices = await prisma.invoice.findMany({ where: { tenantId, quotationId: quotation.id } });
    expect(invoices).toHaveLength(1);
  });
});
