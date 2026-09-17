const STATS = [
  ["2019", "Founded"],
  ["1,200+", "Companies onboarded"],
  ["40+", "Countries"],
  ["99.95%", "Platform uptime"],
];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">About LeadFlow</h2>
          <p className="mt-4 text-ink-500">
            LeadFlow was built after watching service and training companies force very different delivery workflows
            into the same generic lead record. Our mission is simple: give every company a CRM that understands the
            difference between a software project, a consulting engagement, and a training program — without losing
            a single customer interaction along the way.
          </p>
          <p className="mt-4 text-ink-500">
            Today, marketing, sales, delivery and finance teams run their entire customer lifecycle on LeadFlow, from
            the first inbound lead to the final invoice — and every repeat engagement after that.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="card p-6 text-center">
              <p className="text-3xl font-semibold text-brand-600">{value}</p>
              <p className="mt-1 text-sm text-ink-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
