"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

type Item = { description: string; quantity: number; unitPrice: number };

export function LineItemsEditor({
  initialItems,
  initialDiscount = 0,
  initialTax = 0,
}: {
  initialItems?: Item[];
  initialDiscount?: number;
  initialTax?: number;
}) {
  const [items, setItems] = useState<Item[]>(initialItems?.length ? initialItems : [{ description: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(initialDiscount);
  const [tax, setTax] = useState(initialTax);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), [items]);
  const total = subtotal - discount + tax;

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input
              className="col-span-6"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
            />
            <Input
              className="col-span-2"
              type="number"
              min={0}
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
            />
            <Input
              className="col-span-3"
              type="number"
              min={0}
              placeholder="Unit Price"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
            />
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              className="col-span-1 text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])}
        >
          + Add Line Item
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">Discount</span>
          <Input type="number" name="discount" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">Tax</span>
          <Input type="number" name="tax" min={0} value={tax} onChange={(e) => setTax(Number(e.target.value))} />
        </label>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-500">Subtotal</span>
          <span className="text-ink-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Discount</span>
          <span className="text-ink-800">- {formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Tax</span>
          <span className="text-ink-800">+ {formatCurrency(tax)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-ink-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
