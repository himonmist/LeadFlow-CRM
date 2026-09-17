import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = session.user.tenantId;

  const type = new URL(req.url).searchParams.get("type");

  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (type === "leads") {
    const leads = await prisma.lead.findMany({ where: { tenantId }, include: { owner: true } });
    rows = leads.map((l) => ({
      leadNumber: l.leadNumber,
      companyName: l.companyName,
      source: l.source,
      status: l.status,
      businessInterest: l.businessInterest,
      estimatedValue: l.estimatedValue ?? 0,
      owner: l.owner?.name ?? "",
      leadDate: l.leadDate.toISOString().slice(0, 10),
    }));
    filename = "leads.csv";
  } else if (type === "invoices") {
    const invoices = await prisma.invoice.findMany({ where: { tenantId }, include: { customer: true } });
    rows = invoices.map((i) => ({
      invoiceNo: i.invoiceNo,
      customer: i.customer.name,
      status: i.status,
      total: i.total,
      paidAmount: i.paidAmount,
      due: i.total - i.paidAmount,
      dueDate: i.dueDate?.toISOString().slice(0, 10) ?? "",
    }));
    filename = "invoices.csv";
  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
