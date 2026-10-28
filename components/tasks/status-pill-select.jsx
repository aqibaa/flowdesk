"use client";

import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Status dropdown rendered as the coloured status chip.
 * @param {{ value: string, onChange: (status: string) => void, disabled?: boolean, size?: "sm"|"default" }} props
 */
export function StatusPillSelect({ value, onChange, disabled = false }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        aria-label="Status"
        className={cn(badgeVariants({ variant: value }), "h-7 gap-1 border-0 px-2.5 pr-2 shadow-none [&_svg]:size-3 [&_svg]:opacity-70")}
      >
        <SelectValue>{TASK_STATUS_LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {TASK_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className={cn("size-2 rounded-full", {
              "bg-slate-400": s === "todo",
              "bg-blue-500": s === "in_progress",
              "bg-amber-500": s === "in_review",
              "bg-emerald-500": s === "completed",
            })} />
            {TASK_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
