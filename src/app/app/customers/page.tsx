import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listCustomers } from "@/lib/queries/customers";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

export default async function CustomersPage() {
  const user = await requirePermission("customer", "view");
  const customers = await listCustomers(user.tenantId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Customers</h1>
          <p className="text-sm text-ink-500">{customers.length} customer accounts</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Customers are created automatically when a lead converts to an opportunity." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => {
            const openOpps = c.opportunities.filter((o) => o.estimatedValue).length;
            const totalValue = c.opportunities.reduce((sum, o) => sum + o.estimatedValue, 0);
            return (
              <Link key={c.id} href={`/app/customers/${c.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{c.name}</p>
                      <p className="text-xs text-ink-400">{c.industry ?? "—"}</p>
                    </div>
                    <Badge tone="info">{c.contacts.length} contact{c.contacts.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-ink-500">{openOpps} opportunities</span>
                    <span className="font-medium text-ink-800">{formatCurrency(totalValue)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
