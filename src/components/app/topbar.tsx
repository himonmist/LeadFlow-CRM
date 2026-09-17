"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { signOutAction } from "@/app/app/actions";
import { GlobalSearch } from "./global-search";

export function Topbar({
  userName,
  roleLabel,
  unreadCount,
}: {
  userName: string;
  roleLabel: string;
  unreadCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-4">
        <Link href="/app/notifications" className="relative text-ink-500 hover:text-ink-900">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {userName[0]}
            </span>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-medium text-ink-900">{userName}</p>
              <p className="text-xs text-ink-400">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-ink-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <Link href="/app/settings" className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-gray-50">
                Settings
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                  <LogOut size={14} />
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
