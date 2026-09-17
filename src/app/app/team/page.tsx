import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/permissions";
import { inviteTeamMember, toggleUserActive } from "./actions";

export default async function TeamPage() {
  const user = await requirePermission("user", "view");
  const members = await prisma.user.findMany({ where: { tenantId: user.tenantId }, include: { role: true }, orderBy: { createdAt: "asc" } });
  const canManage = can(user.permissions, "user", "create");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-semibold text-ink-900">Team</h1>
        <p className="mb-4 text-sm text-ink-500">{members.length} members in {user.tenantName}</p>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{m.name}</p>
                    <p className="text-xs text-ink-400">{m.title}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{m.role.label}</td>
                  <td className="px-4 py-3 text-ink-500">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.isActive ? "success" : "neutral"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {m.id !== user.id && (
                        <form action={async () => { "use server"; await toggleUserActive(m.id, !m.isActive); }}>
                          <Button type="submit" size="sm" variant="ghost">
                            {m.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {canManage && (
        <Card className="h-fit">
          <p className="mb-3 text-sm font-semibold text-ink-900">Invite Team Member</p>
          <form action={inviteTeamMember} className="grid gap-3">
            <Field label="Name" required>
              <Input name="name" required />
            </Field>
            <Field label="Email" required>
              <Input type="email" name="email" required />
            </Field>
            <Field label="Title">
              <Input name="title" placeholder="e.g. Sales Executive" />
            </Field>
            <Field label="Role" required>
              <Select name="roleName" required defaultValue="SALES">
                {Object.entries(ROLE_LABELS)
                  .filter(([key]) => key !== "SUPER_ADMIN")
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Button type="submit" size="sm">
              Send Invite
            </Button>
            <p className="text-xs text-ink-400">Temporary password: Welcome123! (they should change it after first login)</p>
          </form>
        </Card>
      )}
    </div>
  );
}
