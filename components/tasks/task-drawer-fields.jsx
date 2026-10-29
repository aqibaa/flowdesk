"use client";

import { useState, useTransition } from "react";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { updateTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetClose } from "@/components/ui/sheet";
import { PriorityPillSelect, StatusPillSelect } from "./status-pill-select";

const NONE = "__none__";

/** Shared "save one field" helper: toast on error, silent on success. */
function useFieldSave(taskId) {
  const [pending, start] = useTransition();
  const save = (patch, onDone) =>
    start(async () => {
      const res = await updateTask(taskId, patch);
      if (!res.ok) toast.error(res.errors ? Object.values(res.errors)[0] : res.message);
      else onDone?.();
    });
  return { pending, save };
}

/** Title + description edited in place; other fields are selects/inputs. */
export function TaskDrawerFields({ task, options }) {
  const { pending, save } = useFieldSave(task.id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const descDirty = description !== (task.description ?? "");

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== task.title) save({ title: next });
    else setTitle(task.title);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPillSelect value={task.status} onChange={(status) => save({ status })} disabled={pending} />
          <PriorityPillSelect value={task.priority} onChange={(priority) => save({ priority })} disabled={pending} />
          {pending && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
        </div>
        {/* Close sits on the status row, clear of the breadcrumb. */}
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" aria-label="Close">
            <XIcon />
          </Button>
        </SheetClose>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Task title"
        className={cn(
          "w-full rounded-lg bg-transparent px-2 py-1 font-heading text-xl font-bold leading-tight outline-none -mx-2",
          "hover:bg-muted/50 focus:bg-muted/50 focus:ring-2 focus:ring-ring/30"
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          rows={4}
          placeholder="Add details, acceptance criteria, links…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {descDirty && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDescription(task.description ?? "")}>Cancel</Button>
            <Button size="sm" disabled={pending} onClick={() => save({ description })}>
              <CheckIcon /> Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-assignee">Assignee</Label>
          <Select
            value={task.assignee?.id ?? NONE}
            onValueChange={(v) => save({ assignee_id: v === NONE ? null : v })}
          >
            <SelectTrigger id="task-assignee" size="sm" className="w-full bg-background">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {options.people.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due">Due date</Label>
          <Input
            id="task-due"
            type="date"
            className="h-8 bg-background"
            defaultValue={task.due_date ?? ""}
            onChange={(e) => save({ due_date: e.target.value || null })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-hours">Estimated hours</Label>
          <Input
            id="task-hours"
            type="number"
            min="0"
            step="0.5"
            className="h-8 bg-background"
            defaultValue={task.estimated_hours ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== (task.estimated_hours === null ? null : Number(task.estimated_hours))) save({ estimated_hours: v });
            }}
          />
        </div>
      </div>
    </div>
  );
}
