import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getCustomerTimeline } from "@/lib/queries/customers";
import { can } from "@/lib/permissions";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("customer", "view");
  const { id } = await params;
  const data = await getCustomerTimeline(user.tenantId, id);
  if (!data) notFound();
  const { customer, events } = data;
  const canCreateOpp = can(user.permissions, "opportunity", "create");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{customer.name}</h1>
          <p className="text-sm text-ink-500">
            {[customer.industry, customer.city, customer.country].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Contacts</p>
          {customer.contacts.length === 0 ? (
            <EmptyState title="No contacts yet" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {customer.contacts.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink-900">{c.name}</p>
                    {c.isPrimary && <Badge tone="info">Primary</Badge>}
                  </div>
                  <p className="text-xs text-ink-400">{c.designation ?? "—"}</p>
                  <p className="mt-1 text-xs text-ink-500">{c.email ?? "—"} · {c.phone ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Opportunities</p>
            {canCreateOpp && (
              <ButtonLink href={`/app/opportunities/new?customerId=${customer.id}`} size="sm" variant="secondary">
                + New Opportunity
              </ButtonLink>
            )}
          </div>
          {customer.opportunities.length === 0 ? (
            <EmptyState title="No opportunities yet" />
          ) : (
            <div className="space-y-2">
              {customer.opportunities.map((o) => (
                <Link key={o.id} href={`/app/opportunities/${o.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-brand-200">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{o.opportunityNo} · {o.requirement}</p>
                    <p className="text-xs text-ink-400">{o.engagementType} {o.programName ? `· ${o.programName}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-600">{formatCurrency(o.estimatedValue)}</span>
                    <StatusBadge status={o.stage.key} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Quotations</p>
            {customer.quotations.length === 0 ? (
              <p className="text-sm text-ink-400">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {customer.quotations.map((q) => (
                  <li key={q.id}>
                    <Link href={`/app/quotations/${q.id}`} className="flex items-center justify-between hover:text-brand-600">
                      <span>{q.quotationNo}</span>
                      <StatusBadge status={q.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Invoices</p>
            {customer.invoices.length === 0 ? (
              <p className="text-sm text-ink-400">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {customer.invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/app/finance/invoices/${inv.id}`} className="flex items-center justify-between hover:text-brand-600">
                      <span>{inv.invoiceNo}</span>
                      <StatusBadge status={inv.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="h-fit">
        <p className="mb-3 text-sm font-semibold text-ink-900">Customer Timeline</p>
        {events.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ol className="max-h-[70vh] space-y-4 overflow-y-auto border-l border-gray-100 pl-4">
            {events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <p className="text-xs text-ink-400">{formatDate(e.date)}</p>
                <p className="text-sm font-medium text-ink-900">{e.label}</p>
                {e.detail && <p className="text-xs text-ink-500">{e.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
