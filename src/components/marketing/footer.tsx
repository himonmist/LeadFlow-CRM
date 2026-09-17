import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="#home" className="flex items-center gap-2 text-lg font-semibold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
            LeadFlow
          </Link>
          <p className="mt-3 max-w-xs text-sm text-ink-400">
            From First Lead to Successful Delivery — All in One Workflow.
          </p>
        </div>
        {[
          { title: "Product", links: ["Features", "Solutions", "Pricing"] },
          { title: "Company", links: ["About", "Contact"] },
          { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-ink-900">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-ink-400 hover:text-brand-600">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-ink-400">© {new Date().getFullYear()} LeadFlow CRM. All rights reserved.</p>
    </footer>
  );
}
