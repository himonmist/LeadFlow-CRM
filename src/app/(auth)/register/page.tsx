"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { registerCompany, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerCompany, initialState);

  if (state.success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="card w-full p-8">
          <h1 className="text-xl font-semibold text-ink-900">Workspace created 🎉</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your company workspace, admin account, default pipeline and settings are ready.
          </p>
          <Link href="/login">
            <Button className="mt-6 w-full">Continue to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">L</span>
          LeadFlow
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">Create your company workspace</h1>
        <p className="mt-1 text-sm text-ink-500">Start your 14-day free trial. No credit card required.</p>
      </div>

      <form action={formAction} className="card grid gap-5 p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Company details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" required>
            <Input name="companyName" required placeholder="Acme Solutions Ltd" />
          </Field>
          <Field label="Company Type" required>
            <Select name="companyType" required defaultValue="">
              <option value="" disabled>
                Select type
              </option>
              <option>Private Limited</option>
              <option>Sole Proprietorship</option>
              <option>Partnership</option>
              <option>Public Limited</option>
              <option>Non-Profit</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" required>
            <Select name="industry" required defaultValue="">
              <option value="" disabled>
                Select industry
              </option>
              <option>IT & Software</option>
              <option>Training</option>
              <option>Consulting</option>
              <option>Healthcare</option>
              <option>Professional Services</option>
              <option>Agency</option>
              <option>Resource Augmentation</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Country" required>
            <Input name="country" required placeholder="Bangladesh" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address">
            <Input name="address" placeholder="Street, City" />
          </Field>
          <Field label="Website">
            <Input name="website" placeholder="https://acme.com" />
          </Field>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Admin account</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Admin Name" required>
            <Input name="adminName" required placeholder="Jane Doe" />
          </Field>
          <Field label="Email" required>
            <Input type="email" name="email" required placeholder="jane@acme.com" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile" required>
            <Input name="mobile" required placeholder="+1 555 010 2024" />
          </Field>
          <div />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required>
            <Input type="password" name="password" required minLength={8} placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm Password" required>
            <Input type="password" name="confirmPassword" required minLength={8} />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-600">
          <input type="checkbox" name="agree" required className="mt-0.5" />
          I agree to the Terms of Service and Privacy Policy
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating workspace..." : "Create workspace"}
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
