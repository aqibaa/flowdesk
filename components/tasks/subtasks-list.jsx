"use client";

import { useState, useTransition } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { addSubtask, deleteSubtask, toggleSubtask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

/**
 * Subtask checklist. Admin: toggle, add, remove. `readOnly` (employee
 * portal) shows the checklist without controls.
 */
export function SubtasksList({ taskId, subtasks, readOnly = false }) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const done = subtasks.filter((s) => s.is_done).length;

  const run = (promise) =>
    start(async () => {
      const res = await promise;
      if (!res.ok) toast.error(res.message);
    });

  const submit = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    run(addSubtask({ task_id: taskId, title: t }));
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Subtasks</h3>
        <span className="text-xs text-muted-foreground">
          {subtasks.length === 0 ? "None" : `${done} of ${subtasks.length} completed`}
        </span>
      </div>

      {subtasks.length > 0 && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(100 * done) / subtasks.length}%` }} />
        </div>
      )}

      <ul className="space-y-1">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
            <Checkbox
              id={`sub-${s.id}`}
              checked={s.is_done}
              disabled={readOnly || pending}
              onCheckedChange={(v) => run(toggleSubtask({ id: s.id, is_done: Boolean(v) }))}
            />
            <label
              htmlFor={`sub-${s.id}`}
              className={cn("flex-1 cursor-pointer text-sm", s.is_done && "text-muted-foreground line-through")}
            >
              {s.title}
            </label>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100"
                aria-label="Remove subtask"
                disabled={pending}
                onClick={() => run(deleteSubtask(s.id))}
              >
                <XIcon />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a subtask and press Enter"
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!title.trim() || pending}>
            <PlusIcon /> Add
          </Button>
        </form>
      )}
    </section>
  );
}
