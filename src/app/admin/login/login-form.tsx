"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/fields";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded-[var(--radius-md)] bg-danger-wash p-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <TextField name="email" type="email" label="Email" required autoComplete="username" />
      <TextField name="password" type="password" label="Password" required autoComplete="current-password" />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Sign in
      </Button>
    </form>
  );
}
