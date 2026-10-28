"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";

/** Debounced search box bound to the `q` search param. */
export function SearchInput({ placeholder = "Search…", paramKey = "q", className }) {
  const { params, set } = useUrlState();
  const current = params.get(paramKey) ?? "";
  const [value, setValue] = useState(current);

  // Push to the URL 300ms after typing stops; skip if unchanged.
  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => set({ [paramKey]: value }), 300);
    return () => clearTimeout(t);
  }, [value, current, paramKey, set]);

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/30"
      />
    </div>
  );
}
