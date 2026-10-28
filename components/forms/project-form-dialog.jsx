"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations/projects";
import { createProject, updateProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/**
 * Create / edit a project. `options` = { clients, services, leads }.
 * `urlOpen` (= ?new=1 in the URL) opens the create dialog from the top bar link.
 */
export function ProjectFormDialog({ project, options, trigger, urlOpen = false }) {
  const isEdit = Boolean(project);
  const router = useRouter();
  // Create dialog also opens from ?new=1 (top bar link); edit dialogs ignore it.
  const [localOpen, setLocalOpen] = useState(false);
  const open = localOpen || (!isEdit && urlOpen);
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);
  const serviceLocked = isEdit && project.status !== "pending";

  const { register, handleSubmit, reset, setError, control, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      client_id: project?.client?.id ?? "",
      service_id: project?.service?.id ?? "",
      lead_id: project?.lead?.id ?? "",
      start_date: project?.start_date ?? "",
      due_date: project?.due_date ?? "",
    },
  });

  const onOpenChange = (next) => {
    setLocalOpen(next);
    if (!next) {
      setFormError(null);
      reset();
      // Drop ?new=1 so a refresh does not reopen the dialog.
      if (urlOpen) router.replace("/admin/projects");
    }
  };

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = isEdit ? await updateProject(project.id, values) : await createProject(values);
      if (res.ok) {
        toast.success(res.message);
        onOpenChange(false);
        if (!isEdit && res.id) router.push(`/admin/projects/${res.id}`);
        return;
      }
      if (res.errors) for (const [n, m] of Object.entries(res.errors)) setError(n, { message: m });
      setFormError(res.errors ? null : res.message);
    });

  // Only published services are offered for new projects; keep the current one when editing.
  const services = options.services.filter((s) => s.is_published || s.id === project?.service?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon /> New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project details. Progress is calculated from its tasks."
              : "Pick the client and service. Template tasks are copied when you activate the project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Project name" htmlFor="prj-name" required error={errors.name?.message}>
            <Input id="prj-name" autoFocus placeholder="Northwind — Ecommerce SEO Q4" {...register("name")} aria-invalid={!!errors.name} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => (
                <Field label="Client" htmlFor="prj-client" required error={errors.client_id?.message}>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="prj-client" className="w-full" aria-invalid={!!errors.client_id}>
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="service_id"
              render={({ field }) => (
                <Field
                  label="Service"
                  htmlFor="prj-service"
                  required
                  error={errors.service_id?.message}
                  hint={serviceLocked ? "Locked after activation" : undefined}
                >
                  <Select value={field.value} onValueChange={field.onChange} disabled={serviceLocked}>
                    <SelectTrigger id="prj-service" className="w-full" aria-invalid={!!errors.service_id}>
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="lead_id"
            render={({ field }) => (
              <Field label="Project lead" htmlFor="prj-lead" error={errors.lead_id?.message}>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger id="prj-lead" className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {options.leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="prj-start" error={errors.start_date?.message}>
              <Input id="prj-start" type="date" {...register("start_date")} />
            </Field>
            <Field label="Due date" htmlFor="prj-due" error={errors.due_date?.message}>
              <Input id="prj-due" type="date" {...register("due_date")} aria-invalid={!!errors.due_date} />
            </Field>
          </div>

          <FormMessage variant="banner">{formError}</FormMessage>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
