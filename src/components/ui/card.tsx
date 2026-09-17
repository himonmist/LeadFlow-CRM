import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const toneColor = {
    neutral: "text-ink-900",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "text-amber-600",
  }[tone];

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className={cn("text-2xl font-semibold tracking-tight", toneColor)}>{value}</span>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
      {action}
    </div>
  );
}
