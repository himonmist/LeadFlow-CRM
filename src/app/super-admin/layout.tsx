import { requireSuperAdmin } from "@/lib/session";
import { signOutAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-ink-900 px-6 text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          LeadFlow <span className="text-sm font-normal text-white/50">Platform Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/70">{user.name}</span>
          <form action={signOutAction}>
            <Button type="submit" size="sm" variant="outlineWhite">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
