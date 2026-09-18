"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

/**
 * A submit button that disables itself while its enclosing <form>'s action
 * is pending, so a double-click (or slow network) can't fire the same
 * server action twice — e.g. creating the same opportunity/lead/invoice
 * two times from one click.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel ?? "Saving..." : children}
    </Button>
  );
}
