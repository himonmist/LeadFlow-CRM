import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-16 pb-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <span className="badge badge-info mb-5">From First Lead to Successful Delivery — All in One Workflow</span>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Turn Every Lead Into a Managed Customer Journey.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-500">
            Capture leads, manage follow-ups, schedule services and training programs, generate invoices, and
            monitor your entire customer lifecycle from one intelligent CRM platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/register" size="lg">
              Start Free
            </ButtonLink>
            <ButtonLink href="#contact" size="lg" variant="secondary">
              Book a Demo
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-400">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>

        <div className="relative">
          <div className="card overflow-hidden p-0 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
              <span className="text-sm font-semibold text-ink-900">Dashboard</span>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              {[
                ["Open Opportunities", "58"],
                ["Follow-ups Today", "12"],
                ["Upcoming Training", "4"],
                ["Revenue (MTD)", "৳2.4M"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-[11px] text-ink-400">{label}</p>
                  <p className="text-lg font-semibold text-ink-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 px-5 pb-5">
              {[
                ["New", 8, "bg-indigo-200"],
                ["Qualified", 14, "bg-indigo-300"],
                ["Proposal", 10, "bg-amber-300"],
                ["Negotiation", 6, "bg-amber-400"],
                ["Won", 20, "bg-emerald-400"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end rounded-md bg-gray-50">
                    <div className={`w-full rounded-md ${color}`} style={{ height: `${(value as number) * 4}px` }} />
                  </div>
                  <span className="text-[10px] text-ink-400">{label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="mb-2 text-xs font-semibold text-ink-500">Today&rsquo;s Follow-ups</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="text-ink-700">09:30 · ABC Ltd · Call</span>
                  <span className="text-ink-400">Rahim</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-ink-700">11:00 · XYZ Pharma · Online Meeting</span>
                  <span className="text-ink-400">Karim</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 -z-10 h-40 w-40 rounded-full bg-brand-200 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 -z-10 h-40 w-40 rounded-full bg-amber-200 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
