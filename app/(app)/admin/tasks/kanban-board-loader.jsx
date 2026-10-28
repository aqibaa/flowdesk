"use client";

import dynamic from "next/dynamic";
import { TASK_STATUSES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

// dnd-kit ships only with the board, not with the list view or other pages.
const KanbanBoard = dynamic(() => import("./kanban-board").then((m) => m.KanbanBoard), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((s) => (
        <Skeleton key={s} className="h-96 rounded-2xl" />
      ))}
    </div>
  ),
});

export function KanbanBoardLoader(props) {
  return <KanbanBoard {...props} />;
}
