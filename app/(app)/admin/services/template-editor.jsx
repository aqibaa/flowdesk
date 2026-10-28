"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Loader2Icon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { templateSchema } from "@/lib/validations/services";
import { saveServiceTemplate } from "@/lib/actions/services";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";

/** DB rows → form values (numbers as strings for inputs). */
function toFormTasks(rows) {
  return rows.map((t) => ({
    id: t.id,
    title: t.title ?? "",
    description: t.description ?? "",
    estimated_hours: t.estimated_hours ?? "",
  }));
}

function SortableTaskRow({ field, index, register, errors, onRemove, canRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.key,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const rowErrors = errors.tasks?.[index] ?? {};

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-card p-3 shadow-xs",
        isDragging && "z-10 opacity-80 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <span className="mt-1.5 w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            placeholder="Task title"
            {...register(`tasks.${index}.title`)}
            aria-invalid={!!rowErrors.title}
            className="h-8 font-medium"
          />
          <FormMessage>{rowErrors.title?.message}</FormMessage>
          <div className="flex gap-2">
            <Input
              placeholder="Description (optional)"
              {...register(`tasks.${index}.description`)}
              className="h-8 text-xs"
            />
            <div className="relative w-24 shrink-0">
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                {...register(`tasks.${index}.estimated_hours`)}
                aria-invalid={!!rowErrors.estimated_hours}
                className="h-8 pr-6 text-xs"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                h
              </span>
            </div>
          </div>
          <FormMessage>{rowErrors.estimated_hours?.message}</FormMessage>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove task"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}

/**
 * Ordered, drag-sortable template editor (react-hook-form useFieldArray +
 * dnd-kit sortable). Saved as a whole via saveServiceTemplate().
 */
export function TemplateEditor({ serviceId, initialTasks }) {
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { service_id: serviceId, tasks: toFormTasks(initialTasks) },
  });
  const { control, register, handleSubmit, reset, setError, formState: { errors, isDirty } } = form;
  // keyName "key" keeps our DB `id` field intact on each row.
  const { fields, append, remove, move } = useFieldArray({ control, name: "tasks", keyName: "key" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.key === active.id);
    const to = fields.findIndex((f) => f.key === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  };

  const totalHours = fields.reduce((s, f) => s + Number(f.estimated_hours || 0), 0);

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = await saveServiceTemplate(values);
      if (res.ok) {
        toast.success(res.message);
        // Re-seed the form with server rows so new tasks carry their ids.
        reset({ service_id: serviceId, tasks: toFormTasks(res.tasks ?? []) });
        return;
      }
      if (res.errors) for (const [n, m] of Object.entries(res.errors)) setError(n, { message: m });
      setFormError(res.errors ? null : res.message);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          No template tasks yet. Add the first one below.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {fields.map((field, index) => (
                <SortableTaskRow
                  key={field.key}
                  field={field}
                  index={index}
                  register={register}
                  errors={errors}
                  onRemove={() => remove(index)}
                  canRemove
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <FormMessage>{errors.tasks?.root?.message ?? errors.tasks?.message}</FormMessage>
      <FormMessage variant="banner">{formError}</FormMessage>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ title: "", description: "", estimated_hours: "" })}
        >
          <PlusIcon /> Add task
        </Button>
        <span className="text-xs text-muted-foreground">
          {fields.length} tasks · {totalHours}h estimated
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!isDirty || pending}
            onClick={() => reset({ service_id: serviceId, tasks: toFormTasks(initialTasks) })}
          >
            <RotateCcwIcon /> Reset
          </Button>
          <Button type="submit" size="sm" disabled={!isDirty || pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Save template
          </Button>
        </div>
      </div>
    </form>
  );
}
