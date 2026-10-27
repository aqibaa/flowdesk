import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you are looking for does not exist or you do not have access to it."
        action={
          <Button asChild>
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}
