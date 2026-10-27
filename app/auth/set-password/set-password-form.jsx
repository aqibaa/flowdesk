"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { setPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/shared/form-message";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.password)}
        />
        <FormMessage>{errors.password}</FormMessage>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirm)}
        />
        <FormMessage>{errors.confirm}</FormMessage>
      </div>

      <FormMessage variant="banner">
        {state?.ok === false && !state.errors ? state.message : null}
      </FormMessage>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Save password and continue
      </Button>
    </form>
  );
}
