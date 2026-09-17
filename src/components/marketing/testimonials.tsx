const TESTIMONIALS = [
  {
    quote:
      "We run software delivery and corporate training out of the same CRM now. LeadFlow is the first tool that didn't force training into a generic 'deal' object.",
    name: "Farid Hasan",
    role: "CTO, Vertex Software Ltd",
  },
  {
    quote:
      "The follow-up alerts alone paid for the subscription — we stopped losing leads to silence in the first month.",
    name: "Shirin Akhtar",
    role: "Operations Director, Northline Consulting Group",
  },
  {
    quote:
      "Manager approvals on high-value deals gave us the control we needed without slowing the sales team down.",
    name: "Dr. Anisur Haque",
    role: "Medical Director, Meridian Healthcare Services",
  },
];

export function Testimonials() {
  return (
    <section className="bg-brand-50/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-900">Loved by teams that deliver</h2>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <p className="text-sm text-ink-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
