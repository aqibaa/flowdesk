"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { serviceSchema } from "@/lib/validations/services";
import { createService, updateService } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

/** Create / edit a service's title, description and published flag. */
export function ServiceFormDialog({ service, trigger }) {
  const isEdit = Boolean(service);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);

  const { register, handleSubmit, reset, setError, control, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: service?.title ?? "",
      description: service?.description ?? "",
      is_published: service?.is_published ?? true,
    },
  });

  const onOpenChange = (next) => {
    setOpen(next);
    if (!next) {
      setFormError(null);
      reset();
    }
  };

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = isEdit ? await updateService(service.id, values) : await createService(values);
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
        {trigger ?? (
          <Button>
            <PlusIcon /> New Service
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service" : "New service"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Rename or describe this offering." : "Create the offering first, then build its task template."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Title" htmlFor="svc-title" required error={errors.title?.message}>
            <Input id="svc-title" autoFocus placeholder="Semantic SEO Campaign" {...register("title")} aria-invalid={!!errors.title} />
          </Field>
          <Field label="Description" htmlFor="svc-desc" error={errors.description?.message}>
            <Textarea id="svc-desc" rows={3} {...register("description")} />
          </Field>
          <Controller
            control={control}
            name="is_published"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <Label htmlFor="svc-pub">Published</Label>
                  <p className="text-xs text-muted-foreground">Only published services appear when creating projects.</p>
                </div>
                <Switch id="svc-pub" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
          <FormMessage variant="banner">{formError}</FormMessage>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
