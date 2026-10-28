"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Tasks completed per week, last 6 weeks. Colours come from CSS tokens. */
export function ProductivityChart({ data }) {
  const total = data.reduce((s, d) => s + d.completed, 0);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="font-heading font-semibold">My productivity</h2>
          <p className="text-xs text-muted-foreground">Tasks completed per week, last 6 weeks</p>
        </div>
        <p className="text-sm">
          <span className="font-heading text-xl font-bold">{total}</span>{" "}
          <span className="text-muted-foreground">completed</span>
        </p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 12 }}
              formatter={(v) => [v, "Completed"]}
              labelFormatter={(l) => `Week of ${l}`}
            />
            <Area type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={2.5} fill="url(#prodFill)" dot={{ r: 3, fill: "var(--primary)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
