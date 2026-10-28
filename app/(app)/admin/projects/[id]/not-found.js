import Link from "next/link";
import { FolderXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={FolderXIcon}
      title="Project not found"
      description="It may have been deleted, or the link is wrong."
      action={
        <Button asChild>
          <Link href="/admin/projects">Back to projects</Link>
        </Button>
      }
      className="mt-10"
    />
  );
}
