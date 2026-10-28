"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Recharts is only loaded on pages that draw a chart.
const ProductivityChart = dynamic(
  () => import("./productivity-chart").then((m) => m.ProductivityChart),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-2xl" /> }
);

export function ProductivityChartLoader({ data }) {
  return <ProductivityChart data={data} />;
}
