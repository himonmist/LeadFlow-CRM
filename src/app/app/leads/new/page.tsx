import { requirePermission } from "@/lib/session";
import { listOwners } from "@/lib/queries/leads";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createLead } from "../actions";

const SOURCES = ["WEBSITE", "FACEBOOK", "LINKEDIN", "EMAIL", "PHONE", "REFERRAL", "EVENT", "CAMPAIGN", "EXISTING_CUSTOMER", "PARTNER", "MANUAL"];
const INTERESTS = ["SERVICE", "TRAINING", "SOFTWARE", "CONSULTING", "RESOURCE_AUGMENTATION", "AI_SOLUTION", "OTHER"];

export default async function NewLeadPage() {
  const user = await requirePermission("lead", "create");
  const owners = await listOwners(user.tenantId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-ink-900">New Lead</h1>
      <p className="mt-1 text-sm text-ink-500">Capture the basics — you can add opportunities and activities afterwards.</p>

      <form action={createLead} className="card mt-6 grid gap-5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Company</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" required>
            <Input name="companyName" required placeholder="Acme Inc." />
          </Field>
          <Field label="Industry">
            <Input name="industry" placeholder="e.g. Pharmaceuticals" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <Input name="country" placeholder="Bangladesh" />
          </Field>
          <Field label="City">
            <Input name="city" placeholder="Dhaka" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website">
            <Input name="website" placeholder="https://acme.com" />
          </Field>
          <Field label="Company Size">
            <Input name="companySize" placeholder="e.g. 50-200" />
          </Field>
        </div>
        <Field label="Address">
          <Input name="address" />
        </Field>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Designation">
            <Input name="designation" placeholder="e.g. HR Manager" />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" />
          </Field>
        </div>
        <Field label="Mobile">
          <Input name="mobile" />
        </Field>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Qualification</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lead Source" required>
            <Select name="source" required defaultValue="MANUAL">
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Business Interest" required>
            <Select name="businessInterest" required defaultValue="SERVICE">
              {INTERESTS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Priority">
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Estimated Value (BDT)">
            <Input type="number" name="estimatedValue" min={0} step={1000} />
          </Field>
          <Field label="Owner">
            <Select name="ownerId" defaultValue={user.id}>
              <option value={user.id}>Me ({user.name})</option>
              {owners.filter((o) => o.id !== user.id).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea name="notes" placeholder="What does the customer need?" />
        </Field>

        <Button type="submit" size="lg" className="w-fit">
          Create Lead
        </Button>
      </form>
    </div>
  );
}
