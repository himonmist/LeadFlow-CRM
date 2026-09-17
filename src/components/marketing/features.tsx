import { BarChart3, CalendarClock, GraduationCap, PhoneCall, ReceiptText, Wrench } from "lucide-react";

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Lead Management",
    description: "Capture leads from every channel, qualify them, and never lose track of an interaction again.",
  },
  {
    icon: CalendarClock,
    title: "Smart Follow-up",
    description: "Every call, email and meeting becomes an activity with an automatic next follow-up date.",
  },
  {
    icon: Wrench,
    title: "Service Management",
    description: "Turn won opportunities into scheduled service deliveries with owners and deadlines.",
  },
  {
    icon: GraduationCap,
    title: "Training Management",
    description: "Run training as its own workflow — trainers, venues, participants, and a dedicated calendar.",
  },
  {
    icon: ReceiptText,
    title: "Invoice & Payment",
    description: "Generate quotations and invoices straight from the deal, then track every payment to zero.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Monitoring",
    description: "Pipeline, revenue and team performance dashboards that show what needs attention today.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Why LeadFlow?</h2>
        <p className="mt-3 text-ink-500">
          Service and training engagements don&rsquo;t behave like ordinary lead fields — LeadFlow gives each its own
          configurable workflow.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
            <p className="mt-2 text-sm text-ink-500">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
