"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { clientSchema } from "@/lib/validations/clients";
import { createClient, updateClient } from "@/lib/actions/clients";
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

const EMPTY = { company_name: "", contact_name: "", email: "", phone: "", notes: "" };

/**
 * Add / edit client. Pass `client` to edit; `trigger` to replace the default
 * "+ Add Client" button. Submits via Server Action; server field errors are
 * mapped back onto the form.
 */
export function ClientFormDialog({ client, trigger }) {
  const isEdit = Boolean(client);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);

  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: isEdit
      ? {
          company_name: client.company_name ?? "",
          contact_name: client.contact_name ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          notes: client.notes ?? "",
        }
      : EMPTY,
  });
  const { register, handleSubmit, reset, setError, formState: { errors } } = form;

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
      const res = isEdit ? await updateClient(client.id, values) : await createClient(values);
      if (res.ok) {
        toast.success(res.message);
        onOpenChange(false);
        return;
      }
      if (res.errors) {
        for (const [name, message] of Object.entries(res.errors)) setError(name, { message });
      }
      setFormError(res.errors ? null : res.message);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon /> Add Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "Add a client"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the company or contact details." : "Clients never log in — this is internal reference data."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Company name" htmlFor="company_name" required error={errors.company_name?.message}>
            <Input id="company_name" autoFocus {...register("company_name")} aria-invalid={!!errors.company_name} />
          </Field>

          <Field label="Primary contact" htmlFor="contact_name" error={errors.contact_name?.message}>
            <Input id="contact_name" placeholder="Full name" {...register("contact_name")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" {...register("phone")} />
            </Field>
          </div>

          <Field label="Notes" htmlFor="notes" error={errors.notes?.message} hint="Internal only — preferences, approvals, context.">
            <Textarea id="notes" rows={3} {...register("notes")} />
          </Field>

          <FormMessage variant="banner">{formError}</FormMessage>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
