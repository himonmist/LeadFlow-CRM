const STEPS = ["Capture", "Qualify", "Follow Up", "Convert", "Schedule", "Deliver", "Invoice", "Retain"];

export function HowItWorks() {
  return (
    <section className="bg-ink-900 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How It Works</h2>
          <p className="mt-3 text-white/60">One continuous workflow from first contact to repeat business.</p>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px]">{i + 1}</span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-white/30">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
