import Link from "next/link";
import { requireTenantSession } from "@/lib/session";
import { getCalendarEvents } from "@/lib/queries/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const KIND_TONE: Record<string, "info" | "success" | "warning"> = {
  activity: "info",
  training: "success",
  service: "warning",
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; type?: string }> }) {
  const user = await requireTenantSession();
  const params = await searchParams;
  const monthDate = params.month ? new Date(params.month + "-01") : new Date();
  const events = await getCalendarEvents(user.tenantId, monthDate);
  const filtered = params.type ? events.filter((e) => e.kind === params.type) : events;

  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = new Map<string, typeof filtered>();
  for (const e of filtered) {
    const key = format(e.date, "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Calendar</h1>
          <p className="text-sm text-ink-500">Follow-ups, meetings, training and service delivery in one view.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/calendar?month=${prevMonth}${params.type ? `&type=${params.type}` : ""}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
            ←
          </Link>
          <span className="w-32 text-center text-sm font-medium text-ink-800">{format(monthDate, "MMMM yyyy")}</span>
          <Link href={`/app/calendar?month=${nextMonth}${params.type ? `&type=${params.type}` : ""}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
            →
          </Link>
        </div>
        <div className="flex gap-2">
          {[
            { key: undefined, label: "All" },
            { key: "activity", label: "Follow-ups" },
            { key: "training", label: "Training" },
            { key: "service", label: "Service" },
          ].map((f) => (
            <Link
              key={f.label}
              href={`/app/calendar?month=${format(monthDate, "yyyy-MM")}${f.key ? `&type=${f.key}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${params.type === f.key || (!params.type && !f.key) ? "bg-brand-600 text-white" : "bg-gray-100 text-ink-600"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-semibold uppercase tracking-wide text-ink-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-[110px] border-b border-r border-gray-50 p-2 ${isSameMonth(day, monthDate) ? "" : "bg-gray-50/50"}`}
              >
                <p className={`text-xs ${isToday(day) ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white" : "text-ink-400"}`}>
                  {format(day, "d")}
                </p>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link key={e.id} href={e.href} className="block truncate rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] text-ink-700 hover:bg-gray-100">
                      <Badge tone={KIND_TONE[e.kind]} className="mr-1 px-1 py-0">
                        •
                      </Badge>
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[10px] text-ink-400">+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink-900">This month&rsquo;s events</p>
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-ink-400">Nothing scheduled this month.</p>}
          {filtered.map((e) => (
            <Link key={e.id} href={e.href} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:border-brand-200">
              <div>
                <p className="font-medium text-ink-900">{e.title}</p>
                <p className="text-xs text-ink-400">{e.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">{format(e.date, "MMM d, yyyy")}</p>
                <Badge tone={KIND_TONE[e.kind]}>{e.status.replace(/_/g, " ")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
