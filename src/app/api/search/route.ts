import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ groups: [] }, { status: 401 });
  const tenantId = session.user.tenantId;

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ groups: [] });

  const where = { tenantId, deletedAt: null } as const;

  const [customers, leads, opportunities, invoices, quotations] = await Promise.all([
    prisma.customer.findMany({ where: { ...where, name: { contains: q } }, take: 5 }),
    prisma.lead.findMany({ where: { ...where, companyName: { contains: q } }, take: 5 }),
    prisma.opportunity.findMany({ where: { tenantId, requirement: { contains: q } }, take: 5, include: { customer: true } }),
    prisma.invoice.findMany({ where: { tenantId, invoiceNo: { contains: q } }, take: 5, include: { customer: true } }),
    prisma.quotation.findMany({ where: { tenantId, quotationNo: { contains: q } }, take: 5, include: { customer: true } }),
  ]);

  const groups = [
    { label: "Customers", results: customers.map((c) => ({ id: c.id, title: c.name, href: `/app/customers/${c.id}` })) },
    { label: "Leads", results: leads.map((l) => ({ id: l.id, title: `${l.leadNumber} · ${l.companyName}`, href: `/app/leads/${l.id}` })) },
    {
      label: "Opportunities",
      results: opportunities.map((o) => ({ id: o.id, title: `${o.opportunityNo} · ${o.requirement}`, href: `/app/opportunities/${o.id}` })),
    },
    {
      label: "Invoices",
      results: invoices.map((i) => ({ id: i.id, title: `${i.invoiceNo} · ${i.customer.name}`, href: `/app/finance/invoices/${i.id}` })),
    },
    {
      label: "Quotations",
      results: quotations.map((q2) => ({ id: q2.id, title: `${q2.quotationNo} · ${q2.customer.name}`, href: `/app/quotations/${q2.id}` })),
    },
  ].filter((g) => g.results.length > 0);

  return NextResponse.json({ groups });
}
