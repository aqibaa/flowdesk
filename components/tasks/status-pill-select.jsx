"use client";

import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DOT = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  completed: "bg-emerald-500",
  low: "bg-slate-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  urgent: "bg-rose-500",
};

/** Dropdown rendered as the coloured chip (Badge variant = current value). */
function PillSelect({ value, onChange, disabled, options, labels, ariaLabel }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(badgeVariants({ variant: value }), "h-7 gap-1 border-0 px-2.5 pr-2 shadow-none [&_svg]:size-3 [&_svg]:opacity-70")}
      >
        <SelectValue>{labels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            <span className={cn("size-2 rounded-full", DOT[o])} />
            {labels[o]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** @param {{ value: string, onChange: (status: string) => void, disabled?: boolean }} props */
export function StatusPillSelect(props) {
  return <PillSelect {...props} options={TASK_STATUSES} labels={TASK_STATUS_LABELS} ariaLabel="Status" />;
}

/** @param {{ value: string, onChange: (priority: string) => void, disabled?: boolean }} props */
export function PriorityPillSelect(props) {
  return <PillSelect {...props} options={TASK_PRIORITIES} labels={TASK_PRIORITY_LABELS} ariaLabel="Priority" />;
}
