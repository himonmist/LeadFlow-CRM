import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getOpportunity, listPipelineStages } from "@/lib/queries/opportunities";
import { listOwners } from "@/lib/queries/leads";
import { can } from "@/lib/permissions";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { LogActivityForm } from "@/components/app/log-activity-form";
import { StageControls } from "@/components/app/stage-controls";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateOpportunityNextAction } from "../actions";
import { reviewApproval } from "../../approvals/actions";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("opportunity", "view");
  const { id } = await params;
  const [opportunity, stages, owners] = await Promise.all([
    getOpportunity(user.tenantId, id),
    listPipelineStages(user.tenantId),
    listOwners(user.tenantId),
  ]);
  if (!opportunity) notFound();

  const pendingApproval = opportunity.approvals.find((a) => a.status === "PENDING");
  const canApprove = can(user.permissions, "approval", "approve");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink-900">{opportunity.opportunityNo}</h1>
            <StatusBadge status={opportunity.stage.key} />
            <Badge tone={opportunity.engagementType === "TRAINING" ? "info" : "neutral"}>{opportunity.engagementType}</Badge>
          </div>
          <p className="text-sm text-ink-500">
            {opportunity.customer.name} · {opportunity.requirement}
          </p>
        </div>

        {pendingApproval && (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800">Pending manager approval</p>
            <p className="mt-1 text-sm text-amber-700">{pendingApproval.reason}</p>
            {canApprove ? (
              <form action={reviewApproval} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="approvalId" value={pendingApproval.id} />
                <input type="text" name="reviewComment" placeholder="Add a comment (optional)" className="h-9 flex-1 min-w-[200px] rounded-lg border border-amber-200 bg-white px-3 text-sm" />
                <Button type="submit" name="decision" value="APPROVED" size="sm">
                  Approve
                </Button>
                <Button type="submit" name="decision" value="REVISION_REQUESTED" size="sm" variant="secondary">
                  Request Revision
                </Button>
                <Button type="submit" name="decision" value="REJECTED" size="sm" variant="danger">
                  Reject
                </Button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-amber-600">Waiting for a manager to review this request.</p>
            )}
          </Card>
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Opportunity Details</p>
          <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
            <Info label="Customer" value={opportunity.customer.name} />
            <Info label="Program / Service" value={opportunity.programName ?? "—"} />
            <Info label="Estimated Value" value={formatCurrency(opportunity.estimatedValue)} />
            <Info label="Probability" value={`${opportunity.probability}%`} />
            <Info label="Expected Close" value={formatDate(opportunity.expectedCloseDate)} />
            <Info label="Owner" value={opportunity.owner?.name ?? "Unassigned"} />
            <Info label="Priority" value={<Badge tone={opportunity.priority === "HIGH" ? "danger" : "warning"}>{opportunity.priority}</Badge>} />
            <Info label="Next Action" value={opportunity.nextAction ?? "—"} />
            <Info label="Next Follow-up" value={opportunity.nextFollowUpDate ? formatDate(opportunity.nextFollowUpDate) : "—"} />
          </dl>
          {opportunity.notes && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-ink-600">{opportunity.notes}</p>}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Update Next Action</p>
          <form action={updateOpportunityNextAction} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <Field label="Next Action">
              <Input name="nextAction" defaultValue={opportunity.nextAction ?? ""} />
            </Field>
            <Field label="Next Follow-up">
              <Input type="date" name="nextFollowUpDate" defaultValue={opportunity.nextFollowUpDate?.toISOString().slice(0, 10) ?? ""} />
            </Field>
            <Field label="Probability %">
              <Input type="number" name="probability" min={0} max={100} defaultValue={opportunity.probability} />
            </Field>
            <Button type="submit" size="sm" className="w-fit">
              Save
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Activities</p>
            <LogActivityForm opportunityId={opportunity.id} customerId={opportunity.customerId} owners={owners} returnTo={`/app/opportunities/${opportunity.id}`} />
          </div>
          {opportunity.activities.length === 0 ? (
            <EmptyState title="No activity logged yet" />
          ) : (
            <ol className="space-y-4 border-l border-gray-100 pl-4">
              {opportunity.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <p className="text-xs text-ink-400">{formatDate(a.date)}</p>
                  <p className="text-sm font-medium text-ink-900">{a.type.replace(/_/g, " ")} · {a.subject}</p>
                  {a.outcome && <p className="text-sm text-ink-500">{a.outcome}</p>}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Stage</p>
          <StageControls opportunityId={opportunity.id} stages={stages} currentStageId={opportunity.stageId} />
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Fulfillment</p>
          {opportunity.service ? (
            <Link href={`/app/services/${opportunity.service.id}`} className="block rounded-lg border border-gray-100 p-3 hover:border-brand-200">
              <p className="text-sm font-medium text-ink-900">{opportunity.service.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <StatusBadge status={opportunity.service.status} />
                <span className="text-xs text-ink-500">{formatCurrency(opportunity.service.value)}</span>
              </div>
            </Link>
          ) : opportunity.training ? (
            <Link href={`/app/training/${opportunity.training.id}`} className="block rounded-lg border border-gray-100 p-3 hover:border-brand-200">
              <p className="text-sm font-medium text-ink-900">{opportunity.training.programName}</p>
              <div className="mt-1 flex items-center justify-between">
                <StatusBadge status={opportunity.training.status} />
                <span className="text-xs text-ink-500">{formatCurrency(opportunity.training.fee)}</span>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-ink-400">Delivery record will be created automatically when this opportunity is marked Won.</p>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Quotations</p>
          {opportunity.quotations.length === 0 ? (
            <ButtonLink href={`/app/quotations/new?opportunityId=${opportunity.id}`} size="sm" variant="secondary">
              + Create Quotation
            </ButtonLink>
          ) : (
            <div className="space-y-2">
              {opportunity.quotations.map((q) => (
                <Link key={q.id} href={`/app/quotations/${q.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-brand-200">
                  <span className="text-sm">{q.quotationNo}</span>
                  <StatusBadge status={q.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Invoices</p>
          {opportunity.invoices.length === 0 ? (
            opportunity.stage.isWon ? (
              <ButtonLink href={`/app/finance/invoices/new?opportunityId=${opportunity.id}`} size="sm" variant="secondary">
                + Generate Invoice
              </ButtonLink>
            ) : (
              <p className="text-sm text-ink-400">Available once this deal is Won.</p>
            )
          ) : (
            <div className="space-y-2">
              {opportunity.invoices.map((inv) => (
                <Link key={inv.id} href={`/app/finance/invoices/${inv.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-brand-200">
                  <span className="text-sm">{inv.invoiceNo}</span>
                  <StatusBadge status={inv.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-800">{value}</dd>
    </div>
  );
}
