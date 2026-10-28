"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { taskCreateSchema } from "@/lib/validations/tasks";
import { createTask } from "@/lib/actions/tasks";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { FormMessage } from "@/components/shared/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

function SelectField({ control, name, label, id, placeholder, items, error, allowNone }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field label={label} htmlFor={id} error={error}>
          <Select
            value={field.value || (allowNone ? NONE : "")}
            onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
          >
            <SelectTrigger id={id} className="w-full" aria-invalid={!!error}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowNone && <SelectItem value={NONE}>{placeholder}</SelectItem>}
              {items.map((i) => (
                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  );
}

/**
 * Create task. Opens from the "+ Create Task" button, from a Kanban column
 * "+" (?new=1&new_status=…) and from the top of a project (defaultProjectId).
 */
export function TaskFormDialog({ options, defaultProjectId }) {
  const sp = useSearchParams();
  const { set } = useUrlState();
  // Open when the trigger is clicked OR when the URL says so (?new=1), so the
  // Kanban column "+" buttons and deep links work without remounting.
  const urlOpen = sp.get("new") === "1";
  const [localOpen, setLocalOpen] = useState(false);
  const open = localOpen || urlOpen;
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);
  const initialStatus = TASK_STATUSES.includes(sp.get("new_status")) ? sp.get("new_status") : "todo";

  const { register, handleSubmit, reset, setError, control, formState: { errors } } = useForm({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      project_id: defaultProjectId ?? "",
      title: "",
      description: "",
      status: initialStatus,
      priority: "medium",
      assignee_id: "",
      due_date: "",
      estimated_hours: "",
    },
  });

  const onOpenChange = (next) => {
    setLocalOpen(next);
    if (!next) {
      setFormError(null);
      reset();
      if (urlOpen) set({ new: null, new_status: null, page: sp.get("page") });
    }
  };

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = await createTask(values);
      if (res.ok) {
        toast.success(res.message);
        onOpenChange(false);
        return;
      }
      if (res.errors) for (const [n, m] of Object.entries(res.errors)) setError(n, { message: m });
      setFormError(res.errors ? null : res.message);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Tasks belong to a project and can be assigned to one team member.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <SelectField
            control={control}
            name="project_id"
            label="Project"
            id="task-project"
            placeholder="Choose a project"
            error={errors.project_id?.message}
            items={options.projects.map((p) => ({ value: p.id, label: `${p.name} · ${p.client?.company_name ?? ""}` }))}
          />

          <Field label="Title" htmlFor="task-title" required error={errors.title?.message}>
            <Input id="task-title" autoFocus {...register("title")} aria-invalid={!!errors.title} />
          </Field>

          <Field label="Description" htmlFor="task-desc" error={errors.description?.message}>
            <Textarea id="task-desc" rows={3} {...register("description")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={control}
              name="status"
              label="Status"
              id="task-status"
              items={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            />
            <SelectField
              control={control}
              name="priority"
              label="Priority"
              id="task-priority"
              items={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
            />
            <SelectField
              control={control}
              name="assignee_id"
              label="Assignee"
              id="task-assignee"
              placeholder="Unassigned"
              allowNone
              items={options.people.map((u) => ({ value: u.id, label: u.full_name }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due date" htmlFor="task-due" error={errors.due_date?.message}>
                <Input id="task-due" type="date" {...register("due_date")} />
              </Field>
              <Field label="Est. hours" htmlFor="task-hours" error={errors.estimated_hours?.message}>
                <Input id="task-hours" type="number" min="0" step="0.5" {...register("estimated_hours")} />
              </Field>
            </div>
          </div>

          <FormMessage variant="banner">{formError}</FormMessage>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
