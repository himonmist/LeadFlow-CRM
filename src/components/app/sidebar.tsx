"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_GROUPS } from "./nav-config";
import { can, type PermissionMatrix } from "@/lib/permissions";
import { cn } from "@/lib/cn";

export function Sidebar({
  permissions,
  tenantName,
  open,
  onClose,
}: {
  permissions: PermissionMatrix;
  tenantName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        data-testid="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col overflow-y-auto bg-white lg:static lg:z-auto lg:flex lg:border-r lg:border-gray-100",
          open ? "flex border-r border-gray-100" : "hidden",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">LeadFlow</p>
            <p className="truncate text-xs text-ink-400">{tenantName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-gray-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group, gi) => {
            const items = group.items.filter((item) => !item.entity || can(permissions, item.entity, "view"));
            if (items.length === 0) return null;
            return (
              <div key={gi}>
                {group.title && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{group.title}</p>}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-gray-50"
                        )}
                      >
                        <item.icon size={17} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
