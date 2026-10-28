"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { changePasswordSchema } from "@/lib/validations/settings";
import { changeMyPassword } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { FormMessage } from "@/components/shared/form-message";

export function PasswordForm() {
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState(null);
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = (values) =>
    start(async () => {
      setFormError(null);
      const res = await changeMyPassword(values);
      if (res.ok) {
        toast.success(res.message);
        reset();
        return;
      }
      if (res.errors) for (const [n, m] of Object.entries(res.errors)) setError(n, { message: m });
      setFormError(res.errors ? null : res.message);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="pw-new" required error={errors.password?.message}>
          <Input id="pw-new" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
        </Field>
        <Field label="Confirm password" htmlFor="pw-confirm" required error={errors.confirm?.message}>
          <Input id="pw-confirm" type="password" autoComplete="new-password" {...register("confirm")} aria-invalid={!!errors.confirm} />
        </Field>
      </div>
      <FormMessage variant="banner">{formError}</FormMessage>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <KeyRoundIcon />} Change password
        </Button>
      </div>
    </form>
  );
}
