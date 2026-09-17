"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const AXIS_STYLE = { fontSize: 11, fill: "var(--ink-400)" };

export function LineTrendCard({ title, data, dataKey, color = "#6366f1" }: { title: string; data: any[]; dataKey: string; color?: string }) {
  return (
    <Card>
      <p className="mb-4 text-sm font-semibold text-ink-900">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarTrendCard({
  title,
  data,
  dataKey,
  xKey = "label",
  color = "#6366f1",
  valueFormat,
}: {
  title: string;
  data: any[];
  dataKey: string;
  xKey?: string;
  color?: string;
  valueFormat?: "currency";
}) {
  return (
    <Card>
      <p className="mb-4 text-sm font-semibold text-ink-900">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v) => (valueFormat === "currency" ? formatCurrency(Number(v)) : v)}
          />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
