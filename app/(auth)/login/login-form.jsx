"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/shared/form-message";

export function LoginForm({ next, initialError }) {
  const [state, action, pending] = useActionState(signIn, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@agency.com"
          required
          aria-invalid={Boolean(errors.email)}
        />
        <FormMessage>{errors.email}</FormMessage>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
        />
        <FormMessage>{errors.password}</FormMessage>
      </div>

      <FormMessage variant="banner">
        {state?.ok === false && !state.errors ? state.message : initialError}
      </FormMessage>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
