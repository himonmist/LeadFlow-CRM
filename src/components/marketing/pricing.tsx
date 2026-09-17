import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    tagline: "For small teams getting organized",
    features: ["Up to 5 users", "Lead & opportunity management", "Basic pipeline & calendar", "Email notifications"],
  },
  {
    name: "Professional",
    price: "$79",
    tagline: "For teams running service & training delivery",
    features: ["Up to 20 users", "Service + Training modules", "Quotations & invoicing", "Manager approvals"],
    highlight: true,
  },
  {
    name: "Business",
    price: "$149",
    tagline: "For multi-team operations",
    features: ["Up to 75 users", "Automation rules", "Advanced reports & exports", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "For large or multi-brand organizations",
    features: ["Unlimited users", "SSO & audit exports", "Dedicated success manager", "Custom SLAs"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Simple, transparent pricing</h2>
        <p className="mt-3 text-ink-500">Start free. Upgrade as your delivery pipeline grows.</p>
      </div>
      <div className="mt-14 grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card flex flex-col p-6 ${plan.highlight ? "border-brand-500 ring-2 ring-brand-100" : ""}`}
          >
            {plan.highlight && <span className="badge badge-info mb-3 w-fit">Most popular</span>}
            <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
            <p className="mt-1 text-sm text-ink-500">{plan.tagline}</p>
            <p className="mt-5 text-3xl font-semibold text-ink-900">
              {plan.price}
              {plan.price !== "Custom" && <span className="text-sm font-normal text-ink-400">/mo</span>}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink href="/register" variant={plan.highlight ? "primary" : "secondary"} className="mt-6 w-full">
              Start Free
            </ButtonLink>
          </div>
        ))}
      </div>
    </section>
  );
}
