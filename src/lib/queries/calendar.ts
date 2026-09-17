import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  subtitle: string;
  kind: "activity" | "training" | "service";
  status: string;
  href: string;
};

export async function getCalendarEvents(tenantId: string, monthDate: Date) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const [activities, trainings, services] = await Promise.all([
    prisma.activity.findMany({
      where: { tenantId, date: { gte: start, lte: end } },
      include: { customer: true, lead: true, assignedTo: true },
    }),
    prisma.trainingProgram.findMany({
      where: { tenantId, trainingDate: { gte: start, lte: end } },
      include: { customer: true },
    }),
    prisma.service.findMany({
      where: { tenantId, expectedDeliveryDate: { gte: start, lte: end } },
      include: { customer: true },
    }),
  ]);

  const events: CalendarEvent[] = [
    ...activities.map((a) => ({
      id: `activity-${a.id}`,
      date: a.date,
      title: a.subject,
      subtitle: `${a.type.replace(/_/g, " ")} · ${a.customer?.name ?? a.lead?.companyName ?? "—"}`,
      kind: "activity" as const,
      status: a.status,
      href: a.leadId ? `/app/leads/${a.leadId}` : a.opportunityId ? `/app/opportunities/${a.opportunityId}` : "/app/calendar",
    })),
    ...trainings
      .filter((t) => t.trainingDate)
      .map((t) => ({
        id: `training-${t.id}`,
        date: t.trainingDate as Date,
        title: t.programName,
        subtitle: `Training · ${t.customer.name}`,
        kind: "training" as const,
        status: t.status,
        href: `/app/training/${t.id}`,
      })),
    ...services
      .filter((s) => s.expectedDeliveryDate)
      .map((s) => ({
        id: `service-${s.id}`,
        date: s.expectedDeliveryDate as Date,
        title: s.name,
        subtitle: `Service delivery · ${s.customer.name}`,
        kind: "service" as const,
        status: s.status,
        href: `/app/services/${s.id}`,
      })),
  ];

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}
