const SOLUTIONS = [
  "IT & Software Companies",
  "Training Organizations",
  "Consulting Companies",
  "Healthcare Services",
  "Professional Services",
  "Agencies",
  "Corporate Training Providers",
  "Resource Augmentation Companies",
];

export function Solutions() {
  return (
    <section id="solutions" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Built for service &amp; training businesses</h2>
        <p className="mt-3 text-ink-500">Wherever leads turn into delivered work, LeadFlow keeps it connected.</p>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SOLUTIONS.map((s) => (
          <div key={s} className="card flex items-center gap-3 p-5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
            <span className="text-sm font-medium text-ink-800">{s}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
