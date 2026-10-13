"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, FormMessage, SubmitButton, useOnStateChange } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { changePassword, type FormState } from "./actions";

function strength(pw: string) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 12) score = Math.min(score, 1);
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"][score] };
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, { status: "idle" });
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const s = strength(pw);

  useOnStateChange(state, (s) => s.status === "success" && setPw(""));
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field name="currentPassword" label="Current password" type={show ? "text" : "password"} autoComplete="current-password" required error={state.errors?.currentPassword} />
      <div>
        <Field
          name="newPassword"
          label="New password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={200}
          onChange={(e) => setPw(e.target.value)}
          error={state.errors?.newPassword}
          hint="At least 12 characters with letters and numbers. A short phrase is easiest to remember."
        />
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= s.score ? (s.score <= 1 ? "bg-danger" : s.score <= 2 ? "bg-sun" : "bg-success") : "bg-line",
                )}
              />
            ))}
          </div>
          <span className="w-20 text-right text-xs font-bold text-ink-soft">{s.label}</span>
        </div>
      </div>
      <Field name="confirmPassword" label="Confirm new password" type={show ? "text" : "password"} autoComplete="new-password" required error={state.errors?.confirmPassword} />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
          {show ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          {show ? "Hide passwords" : "Show passwords"}
        </button>
        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
