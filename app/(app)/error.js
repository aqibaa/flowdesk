"use client";

import { useEffect } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/** Error boundary for every portal route (inside the shell). */
export default function PortalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangleIcon}
      title="Something went wrong"
      description={error?.message || "An unexpected error occurred while loading this page."}
      action={<Button onClick={reset}>Try again</Button>}
      className="mt-10"
    />
  );
}
