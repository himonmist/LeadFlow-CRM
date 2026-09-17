"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveOpportunityStage } from "@/app/app/opportunities/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

type Card = {
  id: string;
  opportunityNo: string;
  requirement: string;
  estimatedValue: number;
  engagementType: string;
  customer: { name: string };
  owner: { name: string } | null;
};

type Column = { stage: { id: string; key: string; label: string; isWon: boolean; isClosed: boolean }; opportunities: Card[] };

export function KanbanBoard({ columns: initialColumns }: { columns: Column[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(targetStageId: string) {
    if (!dragging) return;
    const cardId = dragging;
    setDragging(null);
    setError(null);

    let sourceStageId: string | null = null;
    let card: Card | undefined;
    for (const col of columns) {
      const found = col.opportunities.find((o) => o.id === cardId);
      if (found) {
        sourceStageId = col.stage.id;
        card = found;
      }
    }
    if (!card || sourceStageId === targetStageId) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.stage.id === sourceStageId) return { ...col, opportunities: col.opportunities.filter((o) => o.id !== cardId) };
        if (col.stage.id === targetStageId) return { ...col, opportunities: [card as Card, ...col.opportunities] };
        return col;
      })
    );

    startTransition(async () => {
      const result = await moveOpportunityStage(cardId, targetStageId);
      if (result?.error) {
        setError(result.error);
        // revert
        setColumns((prev) =>
          prev.map((col) => {
            if (col.stage.id === targetStageId) return { ...col, opportunities: col.opportunities.filter((o) => o.id !== cardId) };
            if (col.stage.id === sourceStageId) return { ...col, opportunities: [card as Card, ...col.opportunities] };
            return col;
          })
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.stage.id)}
            className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-ink-800">{col.stage.label}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-500">{col.opportunities.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.opportunities.map((o) => (
                <Link
                  key={o.id}
                  href={`/app/opportunities/${o.id}`}
                  draggable
                  onDragStart={() => setDragging(o.id)}
                  className={cn("block cursor-grab rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:border-brand-200", dragging === o.id && "opacity-50")}
                >
                  <p className="text-xs font-medium text-ink-400">{o.opportunityNo}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-900">{o.customer.name}</p>
                  <p className="truncate text-xs text-ink-500">{o.requirement}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-ink-500">{o.owner?.name ?? "Unassigned"}</span>
                    <span className="font-semibold text-ink-800">{formatCurrency(o.estimatedValue)}</span>
                  </div>
                </Link>
              ))}
              {col.opportunities.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-400">Drop here</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
