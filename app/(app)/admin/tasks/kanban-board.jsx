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
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { moveTask } from "@/lib/actions/tasks";
import { KANBAN_COLUMN_LIMIT, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";

const DOT = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  completed: "bg-emerald-500",
};

/** Pure reducer for the optimistic board: move one task to (status, index). */
function applyMove(columns, { taskId, from, to, index }) {
  const task = columns[from].tasks.find((t) => t.id === taskId);
  if (!task) return columns;
  const next = { ...columns };
  next[from] = {
    total: columns[from].total - 1,
    tasks: columns[from].tasks.filter((t) => t.id !== taskId),
  };
  const destTasks = from === to ? next[from].tasks.slice() : columns[to].tasks.slice();
  destTasks.splice(Math.min(index, destTasks.length), 0, { ...task, status: to });
  next[to] = {
    total: from === to ? next[from].total + 1 : columns[to].total + 1,
    tasks: destTasks,
  };
  return next;
}

/** A card is draggable and also a drop target (drop = insert before it). */
function DraggableCard({ task, onOpen }) {
  const data = { type: "card", status: task.status };
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: task.id, data });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: task.id, data });
  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...attributes}
      {...listeners}
      className={cn("rounded-xl transition", isDragging && "opacity-30", isOver && !isDragging && "ring-2 ring-primary/40")}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({ status, column, more, onOpen, onCreate }) {
  const { set } = useUrlState();
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });
  const remaining = column.total - column.tasks.length;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-col rounded-2xl border bg-muted/30 p-2 transition",
        isOver && "border-primary/50 bg-accent/40"
      )}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span className={cn("size-2 rounded-full", DOT[status])} />
        <h3 className="text-xs font-semibold uppercase tracking-wide">{TASK_STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {column.total}
        </span>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => onCreate(status)} aria-label={`Add task in ${TASK_STATUS_LABELS[status]}`}>
          <PlusIcon />
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {column.tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onOpen={() => onOpen(t.id)} />
        ))}
        {column.tasks.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        )}
      </div>

      {remaining > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground"
          onClick={() => set({ [`more_${status}`]: (more[status] ?? 0) + 1, page: undefined })}
        >
          <ChevronDownIcon /> Load {Math.min(remaining, KANBAN_COLUMN_LIMIT)} more
        </Button>
      )}
    </section>
  );
}

/**
 * Four-column Kanban. Drops are applied optimistically via useOptimistic and
 * committed with the move_task RPC; on failure React discards the optimistic
 * state and the server data shows through again.
 */
export function KanbanBoard({ columns, more }) {
  const { set } = useUrlState();
  const [optimistic, addMove] = useOptimistic(columns, applyMove);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const findTask = (id) => {
    for (const s of TASK_STATUSES) {
      const t = optimistic[s].tasks.find((x) => x.id === id);
      if (t) return t;
    }
    return null;
  };

  const onDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = findTask(active.id);
    if (!task) return;

    // Dropped on a column → append; dropped on a card → insert at its index.
    const overData = over.data.current;
    const to = overData?.status ?? over.id;
    if (!TASK_STATUSES.includes(to)) return;
    const destTasks = optimistic[to].tasks.filter((t) => t.id !== task.id);
    let index = destTasks.length;
    if (overData?.type === "card") {
      const i = destTasks.findIndex((t) => t.id === over.id);
      if (i >= 0) index = i;
    }
    if (to === task.status && index === optimistic[to].tasks.findIndex((t) => t.id === task.id)) return;

    const orderedIds = destTasks.slice();
    orderedIds.splice(index, 0, task);
    const ids = orderedIds.map((t) => t.id);

    startTransition(async () => {
      addMove({ taskId: task.id, from: task.status, to, index });
      const res = await moveTask({ task_id: task.id, status: to, ordered_ids: ids });
      if (!res.ok) toast.error(res.message);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveTask(findTask(active.id))}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            column={optimistic[status]}
            more={more}
            onOpen={(id) => set({ task: id, page: undefined })}
            onCreate={(s) => set({ new: "1", new_status: s, page: undefined })}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
