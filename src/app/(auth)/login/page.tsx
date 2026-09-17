"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

const DEMO_ACCOUNTS = [
  ["Company Admin", "admin@brightpharma.com"],
  ["Manager", "manager@brightpharma.com"],
  ["Sales Executive", "sales@brightpharma.com"],
  ["Trainer", "trainer@brightpharma.com"],
  ["Finance", "finance@brightpharma.com"],
  ["Super Admin", "superadmin@leadflow.com"],
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <Link href="/" className="flex w-fit items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          LeadFlow
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Log in to your workspace to pick up where you left off.</p>

        <form action={formAction} className="mt-8 grid max-w-sm gap-4">
          <Field label="Email" required>
            <Input type="email" name="email" required placeholder="you@company.com" />
          </Field>
          <Field label="Password" required>
            <Input type="password" name="password" required placeholder="••••••••" />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-600">
              <input type="checkbox" name="remember" defaultChecked />
              Remember me
            </label>
            <a href="#" className="font-medium text-brand-600">
              Forgot password?
            </a>
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-ink-400">
            <span className="h-px flex-1 bg-gray-200" />
            or continue with
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" disabled>
              Google
            </Button>
            <Button type="button" variant="secondary" disabled>
              Microsoft
            </Button>
          </div>

          <p className="text-center text-sm text-ink-500">
            New here?{" "}
            <Link href="/register" className="font-medium text-brand-600">
              Start free
            </Link>
          </p>
        </form>
      </div>

      <div className="hidden flex-col justify-center bg-ink-900 px-16 py-16 text-white lg:flex">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">Demo workspace</p>
        <h2 className="mt-2 text-2xl font-semibold">Explore every role, instantly</h2>
        <p className="mt-2 text-sm text-white/60">
          Password for every demo account: <span className="font-mono text-white">Passw0rd!</span>
        </p>
        <div className="mt-6 grid gap-2">
          {DEMO_ACCOUNTS.map(([role, email]) => (
            <div key={email} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
              <span className="text-white/70">{role}</span>
              <span className="font-mono text-white">{email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
