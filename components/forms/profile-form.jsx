"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { profileSchema } from "@/lib/validations/settings";
import { updateMyProfile } from "@/lib/actions/settings";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { FormMessage } from "@/components/shared/form-message";

/** Own profile: name + job title. Email and role are read-only here. */
export function ProfileForm({ profile }) {
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);
  const { register, handleSubmit, setError, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name ?? "", job_title: profile.job_title ?? "" },
  });

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = await updateMyProfile(values);
      if (res.ok) {
        toast.success(res.message);
        reset(values);
        return;
      }
      if (res.errors) for (const [n, m] of Object.entries(res.errors)) setError(n, { message: m });
      setFormError(res.errors ? null : res.message);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-4">
        <Avatar name={profile.full_name ?? profile.email} size="lg" className="size-14 text-lg" />
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-semibold">{profile.full_name ?? "—"}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <Badge variant={profile.role === "admin" ? "active" : "secondary"} className="ml-auto capitalize">
          {profile.role}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pf-name" required error={errors.full_name?.message}>
          <Input id="pf-name" {...register("full_name")} aria-invalid={!!errors.full_name} />
        </Field>
        <Field label="Job title" htmlFor="pf-title" error={errors.job_title?.message}>
          <Input id="pf-title" placeholder="SEO Specialist" {...register("job_title")} />
        </Field>
        <Field label="Work email" htmlFor="pf-email" hint="Managed by your login; contact an admin to change it.">
          <Input id="pf-email" value={profile.email ?? ""} readOnly disabled />
        </Field>
        <Field label="Assigned role" htmlFor="pf-role" hint={profile.role === "admin" ? "Roles are managed under Roles & Access." : "Only an admin can change your role."}>
          <Input id="pf-role" value={profile.role} readOnly disabled className="capitalize" />
        </Field>
      </div>

      <FormMessage variant="banner">{formError}</FormMessage>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />} Save profile
        </Button>
      </div>
    </form>
  );
}
