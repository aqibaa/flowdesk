import { cn } from "@/lib/utils";

const TONES = {
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
};

/**
 * KPI tile as in the mockups: uppercase label, big value with unit, icon
 * tile top-right, optional footnote line.
 * @param {{ label: string, value: React.ReactNode, unit?: string, icon?: React.ComponentType, tone?: keyof TONES, footnote?: React.ReactNode, className?: string }} props
 */
export function KpiCard({ label, value, unit, icon: Icon, tone = "violet", footnote, className }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-3 font-heading text-3xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1.5 text-base font-medium text-muted-foreground">{unit}</span>}
      </p>
      {footnote && <div className="mt-3 text-xs text-muted-foreground">{footnote}</div>}
    </div>
  );
}
