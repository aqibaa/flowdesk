import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";
import { BackButton } from "@/components/shared/back-button";

/** Root 404: unknown URLs outside the portal shell (and signed-out users). */
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      description="The page you are looking for doesn't exist, was moved, or you don't have access to it."
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
