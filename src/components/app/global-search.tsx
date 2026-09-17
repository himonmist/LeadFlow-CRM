"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Group = { label: string; results: { id: string; title: string; href: string }[] };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setGroups([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setGroups(data.groups ?? []);
      } catch {
        /* aborted */
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3">
        <Search size={16} className="text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers, leads, opportunities, invoices…"
          className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
      </div>
      {open && groups.length > 0 && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {groups.map((g) => (
            <div key={g.label} className="border-b border-gray-50 p-2 last:border-0">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{g.label}</p>
              {g.results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(r.href);
                  }}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-ink-700 hover:bg-gray-50"
                >
                  {r.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
