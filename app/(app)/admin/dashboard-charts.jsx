"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

/** Tasks-completed trend (area) + projects-by-service donut. */
export function DashboardCharts({ trend, byService, activeTotal }) {
  const total = trend.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading font-semibold">Tasks completed over time</h2>
            <p className="text-xs text-muted-foreground">Actual velocity across the last 6 weeks</p>
          </div>
          <Badge variant="active">{total} completed</Badge>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} formatter={(v) => [v, "Completed"]} labelFormatter={(l) => `Week of ${l}`} />
              <Area type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={2.5} fill="url(#dashFill)" dot={{ r: 3, fill: "var(--primary)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-heading font-semibold">Projects by service</h2>
        <p className="text-xs text-muted-foreground">Distribution of all {activeTotal} active engagement{activeTotal === 1 ? "" : "s"}</p>
        {byService.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No active projects yet.</p>
        ) : (
          <div className="mt-2 grid items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byService} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                    {byService.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} project${v === 1 ? "" : "s"}`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl font-bold">{activeTotal}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">active</span>
              </div>
            </div>
            <ul className="space-y-2">
              {byService.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.value} ({activeTotal ? Math.round((100 * s.value) / activeTotal) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
