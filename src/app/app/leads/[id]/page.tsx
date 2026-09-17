import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getLead, listOwners } from "@/lib/queries/leads";
import { can } from "@/lib/permissions";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { LogActivityForm } from "@/components/app/log-activity-form";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { convertLeadToOpportunity } from "../actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("lead", "view");
  const { id } = await params;
  const lead = await getLead(user.tenantId, id);
  if (!lead) notFound();

  const owners = await listOwners(user.tenantId);
  const canCreateOpp = can(user.permissions, "opportunity", "create");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink-900">{lead.companyName}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-ink-500">
            {lead.leadNumber} · Created {formatDate(lead.leadDate)} · Owner {lead.owner?.name ?? "Unassigned"}
          </p>
        </div>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Lead Details</p>
          <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
            <Info label="Contact" value={lead.contact?.name ?? "—"} />
            <Info label="Designation" value={lead.designation ?? "—"} />
            <Info label="Email" value={lead.email ?? "—"} />
            <Info label="Mobile" value={lead.mobile ?? "—"} />
            <Info label="Website" value={lead.website ?? "—"} />
            <Info label="Industry" value={lead.industry ?? "—"} />
            <Info label="Location" value={[lead.city, lead.country].filter(Boolean).join(", ") || "—"} />
            <Info label="Source" value={lead.source.replace(/_/g, " ")} />
            <Info label="Business Interest" value={lead.businessInterest.replace(/_/g, " ")} />
            <Info label="Priority" value={<Badge tone={lead.priority === "HIGH" ? "danger" : lead.priority === "MEDIUM" ? "warning" : "neutral"}>{lead.priority}</Badge>} />
            <Info label="Estimated Value" value={lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"} />
          </dl>
          {lead.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-ink-600">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Notes</p>
              {lead.notes}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Activities &amp; Follow-ups</p>
            <LogActivityForm leadId={lead.id} owners={owners} returnTo={`/app/leads/${lead.id}`} />
          </div>
          {lead.activities.length === 0 ? (
            <EmptyState title="No activity logged yet" description="Log a call, email or meeting to start the timeline." />
          ) : (
            <ol className="space-y-4 border-l border-gray-100 pl-4">
              {lead.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <p className="text-xs text-ink-400">{formatDate(a.date)}</p>
                  <p className="text-sm font-medium text-ink-900">
                    {a.type.replace(/_/g, " ")} · {a.subject}
                  </p>
                  {a.outcome && <p className="text-sm text-ink-500">{a.outcome}</p>}
                  {a.nextAction && (
                    <p className="mt-1 text-xs text-ink-400">
                      Next: {a.nextAction} {a.nextFollowUpDate && `(${formatDate(a.nextFollowUpDate)})`}
                    </p>
                  )}
                  <p className="text-xs text-ink-400">Assigned: {a.assignedTo?.name ?? "—"}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        {lead.opportunities.length > 0 ? (
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">Opportunities</p>
            <div className="space-y-2">
              {lead.opportunities.map((o) => (
                <Link key={o.id} href={`/app/opportunities/${o.id}`} className="block rounded-lg border border-gray-100 p-3 hover:border-brand-200">
                  <p className="text-sm font-medium text-ink-900">{o.opportunityNo}</p>
                  <p className="text-xs text-ink-500">{o.requirement}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge status={o.stage.key} />
                    <span className="text-xs text-ink-500">{formatCurrency(o.estimatedValue)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          canCreateOpp &&
          lead.status !== "CONVERTED" && (
            <Card>
              <p className="mb-3 text-sm font-semibold text-ink-900">Convert to Opportunity</p>
              <form action={convertLeadToOpportunity} className="grid gap-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Field label="Requirement" required>
                  <Textarea name="requirement" required defaultValue={lead.notes ?? ""} />
                </Field>
                <Field label="Engagement Type" required>
                  <Select name="engagementType" required defaultValue={lead.businessInterest === "TRAINING" ? "TRAINING" : "SERVICE"}>
                    <option value="SERVICE">Service</option>
                    <option value="TRAINING">Training</option>
                  </Select>
                </Field>
                <Field label="Program / Service Name">
                  <Input name="programName" placeholder="e.g. AI Sales Training" />
                </Field>
                <Field label="Estimated Value (BDT)" required>
                  <Input type="number" name="estimatedValue" required min={0} step={1000} defaultValue={lead.estimatedValue ?? 0} />
                </Field>
                <Button type="submit">Create Opportunity</Button>
              </form>
            </Card>
          )
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Timeline</p>
          <ol className="space-y-3 border-l border-gray-100 pl-4 text-sm">
            <li>
              <p className="text-xs text-ink-400">{formatDateTime(lead.leadDate)}</p>
              <p className="text-ink-700">Lead created via {lead.source.replace(/_/g, " ")}</p>
            </li>
            {lead.activities
              .slice()
              .reverse()
              .map((a) => (
                <li key={a.id}>
                  <p className="text-xs text-ink-400">{formatDateTime(a.date)}</p>
                  <p className="text-ink-700">{a.subject}</p>
                </li>
              ))}
            {lead.opportunities.map((o) => (
              <li key={o.id}>
                <p className="text-xs text-ink-400">{formatDateTime(o.createdAt)}</p>
                <p className="text-ink-700">Opportunity {o.opportunityNo} created</p>
              </li>
            ))}
          </ol>
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
