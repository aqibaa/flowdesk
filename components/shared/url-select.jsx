"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * A <Select> bound to one URL search param. The "all" value clears it.
 * @param {{ paramKey: string, allLabel: string, options: {value:string,label:string}[], className?: string }} props
 */
export function UrlSelect({ paramKey, allLabel, options, className }) {
  const { params, set } = useUrlState();
  const value = params.get(paramKey) ?? "all";

  return (
    <Select value={value} onValueChange={(v) => set({ [paramKey]: v })}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
