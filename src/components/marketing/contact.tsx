"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-24">
      <div className="card grid gap-10 p-8 lg:grid-cols-2 lg:p-12">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Let&rsquo;s talk</h2>
          <p className="mt-3 text-ink-500">
            Tell us about your lead-to-delivery workflow and we&rsquo;ll show you how LeadFlow maps to it.
          </p>
          <div className="mt-8 space-y-3 text-sm text-ink-600">
            <p>hello@leadflow.com</p>
            <p>+1 (555) 010-2024</p>
            <p>Available Monday–Friday, 9am–6pm</p>
          </div>
        </div>
        {submitted ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 p-8 text-center">
            <p className="text-base font-semibold text-emerald-700">Thanks — we got it.</p>
            <p className="mt-1 text-sm text-emerald-600">Our team will reach out within one business day.</p>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input required name="name" placeholder="Jane Doe" />
              </Field>
              <Field label="Company" required>
                <Input required name="company" placeholder="Acme Inc." />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required>
                <Input required type="email" name="email" placeholder="jane@acme.com" />
              </Field>
              <Field label="Phone">
                <Input name="phone" placeholder="+1 555 010 2024" />
              </Field>
            </div>
            <Field label="Requirement">
              <Input name="requirement" placeholder="e.g. Training delivery + invoicing" />
            </Field>
            <Field label="Message" required>
              <Textarea required name="message" placeholder="What are you trying to solve?" />
            </Field>
            <Button type="submit" className="mt-1">
              Send message
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
