const LOGOS = ["Northline Group", "Vertex Software", "Meridian Health", "Skyline Partners", "Bright Pharma", "Arclight Consulting"];

export function TrustedBy() {
  return (
    <section className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-ink-400">
          Trusted by growing service &amp; training businesses
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {LOGOS.map((logo) => (
            <div
              key={logo}
              className="flex h-12 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-sm font-semibold text-ink-400"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
