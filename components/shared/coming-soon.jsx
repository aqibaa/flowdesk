import { ConstructionIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

/** Placeholder for routes whose real content ships in a later phase. */
export function ComingSoon({ title, description, phase }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={ConstructionIcon}
        title={`Arrives in Phase ${phase}`}
        description="This page is wired into navigation and access control already; its content is built in a later phase."
      />
    </>
  );
}
