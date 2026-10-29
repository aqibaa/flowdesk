import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";
import { BackButton } from "@/components/shared/back-button";

/** 404 inside the portal shell (sidebar + top bar stay visible). */
export default function PortalNotFound() {
  return (
    <StatusPage
      inShell
      code="404"
      title="Page not found"
      description="This page doesn't exist or the link is out of date."
      actions={
        <>
          <Button asChild>
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
          <BackButton />
        </>
      }
    />
  );
}
