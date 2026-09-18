"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { PermissionMatrix } from "@/lib/permissions";

export function AppShell({
  permissions,
  tenantName,
  userName,
  roleLabel,
  unreadCount,
  children,
}: {
  permissions: PermissionMatrix;
  tenantName: string;
  userName: string;
  roleLabel: string;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route actually changes, so it
  // doesn't stay open over the next page after tapping a link.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
      <div className="no-print contents">
        <Sidebar permissions={permissions} tenantName={tenantName} open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="no-print contents">
          <Topbar userName={userName} roleLabel={roleLabel} unreadCount={unreadCount} onMenuClick={() => setNavOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  );
}
