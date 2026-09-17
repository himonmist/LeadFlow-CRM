import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listTrainingPrograms } from "@/lib/queries/training";
import { Card, EmptyState } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function TrainingPage() {
  const user = await requirePermission("training", "view");
  const programs = await listTrainingPrograms(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Training Programs</h1>
          <p className="text-sm text-ink-500">{programs.length} programs</p>
        </div>
        <ButtonLink href="/app/calendar?type=training" variant="secondary">
          View Training Calendar
        </ButtonLink>
      </div>

      <Card className="overflow-x-auto p-0">
        {programs.length === 0 ? (
          <EmptyState title="No training programs yet" description="Programs are created automatically when a Training-type opportunity is marked Won." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Trainer</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Participants</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {programs.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/app/training/${t.id}`} className="font-medium text-brand-600">
                      {t.programName}
                    </Link>
                    <p className="text-xs text-ink-400">{t.category ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{t.customer.name}</td>
                  <td className="px-4 py-3 text-ink-500">{t.trainer?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{t.deliveryMode}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-400">{t.trainingDate ? formatDate(t.trainingDate) : "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{t.participants ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(t.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
