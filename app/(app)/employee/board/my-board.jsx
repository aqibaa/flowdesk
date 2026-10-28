"use client";

import { startTransition, useOptimistic, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { updateMyTaskStatus } from "@/lib/actions/employee";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/tasks/task-card";

const DOT = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  completed: "bg-emerald-500",
};

/** Move a task between columns (status only — employees cannot reorder). */
function applyMove(columns, { taskId, from, to }) {
  const task = columns[from].find((t) => t.id === taskId);
  if (!task) return columns;
  return {
    ...columns,
    [from]: columns[from].filter((t) => t.id !== taskId),
    [to]: [...columns[to], { ...task, status: to }],
  };
}

function Card({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { status: task.status } });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <TaskCard task={task} onOpen={onOpen} hideAssignee />
    </div>
  );
}

function Column({ status, tasks, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[20rem] flex-col rounded-2xl border bg-muted/30 p-2 transition",
        isOver && "border-primary/50 bg-accent/40"
      )}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span className={cn("size-2 rounded-full", DOT[status])} />
        <h3 className="text-xs font-semibold uppercase tracking-wide">{TASK_STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tasks.length}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((t) => (
          <Card key={t.id} task={t} onOpen={() => onOpen(t.id)} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Drop tasks here</p>
        )}
      </div>
    </section>
  );
}

/** Personal Kanban: only the signed-in employee's tasks; drop = status change. */
export function MyBoard({ columns }) {
  const { set } = useUrlState();
  const [optimistic, addMove] = useOptimistic(columns, applyMove);
  const [active, setActive] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const findTask = (id) => TASK_STATUSES.flatMap((s) => optimistic[s]).find((t) => t.id === id);

  const onDragEnd = ({ active: a, over }) => {
    setActive(null);
    if (!over) return;
    const task = findTask(a.id);
    const to = TASK_STATUSES.includes(over.id) ? over.id : findTask(over.id)?.status;
    if (!task || !to || to === task.status) return;

    startTransition(async () => {
      addMove({ taskId: task.id, from: task.status, to });
      const res = await updateMyTaskStatus({ task_id: task.id, status: to });
      if (!res.ok) toast.error(res.message);
      else if (to === "completed") toast.success(res.message);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active: a }) => setActive(findTask(a.id))}
      onDragCancel={() => setActive(null)}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((s) => (
          <Column key={s} status={s} tasks={optimistic[s]} onOpen={(id) => set({ task: id })} />
        ))}
      </div>
      <DragOverlay>{active ? <TaskCard task={active} dragging hideAssignee /> : null}</DragOverlay>
    </DndContext>
  );
}
