import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  NEW: "info",
  CONTACTED: "info",
  QUALIFIED: "info",
  UNQUALIFIED: "neutral",
  CONVERTED: "success",
  REQUIREMENT_IDENTIFIED: "info",
  PROPOSAL: "warning",
  NEGOTIATION: "warning",
  APPROVAL: "warning",
  WON: "success",
  LOST: "danger",
  POSTPONED: "neutral",
  CANCELLED: "danger",
  ON_HOLD: "neutral",
  SCHEDULED: "info",
  CONFIRMED: "info",
  IN_PROGRESS: "warning",
  PARTIALLY_DELIVERED: "warning",
  COMPLETED: "success",
  PENDING: "warning",
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ISSUED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "danger",
  SENT: "info",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "neutral",
  REVISION_REQUESTED: "warning",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return <Badge tone={tone}>{status.replace(/_/g, " ")}</Badge>;
}
