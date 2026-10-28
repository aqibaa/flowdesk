"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Both charts live in one chunk so Recharts is fetched once for the page.
const DashboardCharts = dynamic(
  () => import("./dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    ),
  }
);

export function DashboardChartsLoader(props) {
  return <DashboardCharts {...props} />;
}
