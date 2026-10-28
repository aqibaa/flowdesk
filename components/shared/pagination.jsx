"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Builds a compact page list like 1 2 3 … 10 around the current page. */
function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set([1, totalPages, page - 1, page, page + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    if (i > 0 && list[i] - list[i - 1] > 1) out.push("…");
    out.push(list[i]);
  }
  return out;
}

/**
 * URL-driven pagination footer: "Showing a to b of n" + page buttons.
 * @param {{ page: number, total: number, pageSize?: number, noun?: string }} props
 */
export function Pagination({ page, total, pageSize = PAGE_SIZE, noun = "items" }) {
  const { set } = useUrlState();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Showing {from} to {to} of {total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>
          <ChevronLeftIcon /> Previous
        </Button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon-sm"
              className={cn("text-xs", p === page && "pointer-events-none")}
              onClick={() => set({ page: p })}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => set({ page: page + 1 })}>
          Next <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
