"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Manual refresh (no polling): re-runs the Server Component data fetches. */
export function RefreshButton({ updatedAt }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Updated {updatedAt}</span>
      <Button variant="outline" onClick={() => start(() => router.refresh())} disabled={pending}>
        <RefreshCwIcon className={pending ? "animate-spin" : undefined} /> Refresh
      </Button>
    </div>
  );
}
