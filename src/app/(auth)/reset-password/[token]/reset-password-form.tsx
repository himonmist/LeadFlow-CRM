"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { resetPassword, type ResetPasswordState } from "../../forgot-password/actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex w-fit items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          LeadFlow
        </Link>

        {state.success ? (
          <>
            <h1 className="mt-8 text-2xl font-semibold text-ink-900">Password reset</h1>
            <p className="mt-2 text-sm text-ink-500">Your password has been changed. You can now log in with it.</p>
            <Link href="/login" className="mt-6 block w-fit">
              <Button size="lg">Go to login</Button>
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-semibold text-ink-900">Set a new password</h1>
            <p className="mt-1 text-sm text-ink-500">Choose a new password for your account.</p>

            <form action={formAction} className="mt-8 grid gap-4">
              <input type="hidden" name="token" value={token} />
              <Field label="New Password" required hint="At least 8 characters.">
                <Input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
              </Field>
              <Field label="Confirm New Password" required>
                <Input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
              </Field>

              {state.error && <p className="text-sm text-red-600">{state.error}</p>}

              <Button type="submit" size="lg" disabled={pending} className="mt-2">
                {pending ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link href="/login" className="font-medium text-brand-600">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
