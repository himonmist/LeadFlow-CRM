import { requirePermission } from "@/lib/session";
import { listApprovals, getManagerAlerts } from "@/lib/queries/approvals";
import { can } from "@/lib/permissions";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { reviewApproval } from "./actions";
import Link from "next/link";

function entityLink(a: Awaited<ReturnType<typeof listApprovals>>[number]) {
  if (a.opportunity) return { label: `${a.opportunity.opportunityNo} · ${a.opportunity.customer.name}`, href: `/app/opportunities/${a.opportunity.id}` };
  if (a.quotation) return { label: `${a.quotation.quotationNo} · ${a.quotation.customer.name}`, href: `/app/quotations/${a.quotation.id}` };
  if (a.invoice) return { label: `${a.invoice.invoiceNo} · ${a.invoice.customer.name}`, href: `/app/finance/invoices/${a.invoice.id}` };
  return { label: "—", href: "#" };
}

export default async function ApprovalsPage() {
  const user = await requirePermission("approval", "view");
  const approvals = await listApprovals(user.tenantId);
  const canApprove = can(user.permissions, "approval", "approve");
  const alerts = canApprove ? await getManagerAlerts(user.tenantId) : null;

  const pending = approvals.filter((a) => a.status === "PENDING");
  const reviewed = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Approvals</h1>
        <p className="text-sm text-ink-500">{pending.length} pending review</p>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink-900">Pending Requests</p>
        {pending.length === 0 ? (
          <EmptyState title="Nothing waiting on you" description="High-value deals, large discounts and big invoices will show up here for review." />
        ) : (
          <div className="space-y-3">
            {pending.map((a) => {
              const target = entityLink(a);
              return (
                <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone="warning">{a.type.replace(/_/g, " ")}</Badge>
                        <Link href={target.href} className="text-sm font-medium text-brand-700">
                          {target.label}
                        </Link>
                      </div>
                      <p className="mt-1 text-sm text-amber-800">{a.reason}</p>
                      <p className="mt-1 text-xs text-ink-400">
                        Requested by {a.requestedBy.name} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    {canApprove && (
                      <form action={reviewApproval} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="approvalId" value={a.id} />
                        <input type="text" name="reviewComment" placeholder="Comment (optional)" className="h-9 w-48 rounded-lg border border-amber-200 bg-white px-3 text-sm" />
                        <Button type="submit" name="decision" value="APPROVED" size="sm">
                          Approve
                        </Button>
                        <Button type="submit" name="decision" value="REVISION_REQUESTED" size="sm" variant="secondary">
                          Revise
                        </Button>
                        <Button type="submit" name="decision" value="REJECTED" size="sm" variant="danger">
                          Reject
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {alerts && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Overdue Follow-ups</p>
            {alerts.overdueFollowUps.length === 0 ? (
              <p className="text-sm text-ink-400">All caught up.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {alerts.overdueFollowUps.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span className="text-ink-700">{a.customer?.name ?? a.lead?.companyName ?? "—"}</span>
                    <span className="text-ink-400">{a.assignedTo?.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">High-value Open Opportunities</p>
            {alerts.highValueOpen.length === 0 ? (
              <p className="text-sm text-ink-400">None currently.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {alerts.highValueOpen.map((o) => (
                  <li key={o.id}>
                    <Link href={`/app/opportunities/${o.id}`} className="flex justify-between hover:text-brand-600">
                      <span>{o.customer.name}</span>
                      <span className="font-medium">{formatCurrency(o.estimatedValue)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Unassigned Leads</p>
            {alerts.unassignedLeads.length === 0 ? (
              <p className="text-sm text-ink-400">Every lead has an owner.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {alerts.unassignedLeads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/app/leads/${l.id}`} className="hover:text-brand-600">
                      {l.companyName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Stale Leads (5+ days, no progress)</p>
            {alerts.staleLeads.length === 0 ? (
              <p className="text-sm text-ink-400">Nothing stale right now.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {alerts.staleLeads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/app/leads/${l.id}`} className="flex justify-between hover:text-brand-600">
                      <span>{l.companyName}</span>
                      <span className="text-ink-400">{formatDate(l.leadDate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink-900">History</p>
        {reviewed.length === 0 ? (
          <p className="text-sm text-ink-400">No reviewed approvals yet.</p>
        ) : (
          <div className="space-y-2">
            {reviewed.map((a) => {
              const target = entityLink(a);
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{a.type.replace(/_/g, " ")}</Badge>
                      <Link href={target.href} className="font-medium text-brand-600">
                        {target.label}
                      </Link>
                    </div>
                    <p className="text-xs text-ink-400">Reviewed by {a.reviewedBy?.name ?? "—"}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
