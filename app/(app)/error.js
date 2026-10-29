"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

/** Error boundary for every portal route (inside the shell). */
export default function PortalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      inShell
      tone="danger"
      code="500"
      title="Something went wrong"
      description={
        process.env.NODE_ENV === "development" && error?.message
          ? error.message
          : "We couldn't load this page. Try again, or head back to your dashboard."
      }
      actions={
        <>
          <Button onClick={reset}>
            <RotateCcwIcon /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
          {error?.digest && (
            <span className="basis-full text-xs text-muted-foreground">Error ID: {error.digest}</span>
          )}
        </>
      }
    />
  );
}
