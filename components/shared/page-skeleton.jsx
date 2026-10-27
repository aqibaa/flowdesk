import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic route skeleton: header + KPI row + a content block.
 * Used by loading.js files; pages with a distinctive layout ship their own.
 */
export function PageSkeleton({ kpis = 4, rows = 6 }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {kpis > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: kpis }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-2xl border p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
