"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex w-fit items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          LeadFlow
        </Link>

        {state.submitted ? (
          <>
            <h1 className="mt-8 text-2xl font-semibold text-ink-900">Check your email</h1>
            <p className="mt-2 text-sm text-ink-500">
              If an account exists for that email, we&rsquo;ve sent a link to reset your password. It expires in 1 hour.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-semibold text-ink-900">Forgot your password?</h1>
            <p className="mt-1 text-sm text-ink-500">Enter your email and we&rsquo;ll send you a reset link.</p>

            <form action={formAction} className="mt-8 grid gap-4">
              <Field label="Email" required>
                <Input type="email" name="email" required placeholder="you@company.com" />
              </Field>
              <Button type="submit" size="lg" disabled={pending} className="mt-2">
                {pending ? "Sending..." : "Send reset link"}
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
