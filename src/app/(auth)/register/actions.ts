"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  companyName: z.string().min(2),
  companyType: z.string().min(1),
  industry: z.string().min(1),
  country: z.string().min(1),
  address: z.string().optional(),
  website: z.string().optional(),
  adminName: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(6),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  agree: z.literal("on"),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PIPELINE_STAGES = [
  { key: "NEW", label: "New", order: 1 },
  { key: "CONTACTED", label: "Contacted", order: 2 },
  { key: "QUALIFIED", label: "Qualified", order: 3 },
  { key: "REQUIREMENT_IDENTIFIED", label: "Requirement Identified", order: 4 },
  { key: "PROPOSAL", label: "Proposal / Quotation", order: 5 },
  { key: "NEGOTIATION", label: "Negotiation", order: 6 },
  { key: "APPROVAL", label: "Approval", order: 7 },
  { key: "WON", label: "Won", order: 8, isClosed: true, isWon: true },
  { key: "LOST", label: "Lost", order: 9, isClosed: true },
  { key: "POSTPONED", label: "Postponed", order: 10, isClosed: true },
  { key: "CANCELLED", label: "Cancelled", order: 11, isClosed: true },
  { key: "ON_HOLD", label: "On Hold", order: 12 },
];

export type RegisterState = { error?: string; success?: boolean };

export async function registerCompany(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  if (data.password !== data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const baseSlug = slugify(data.companyName) || "company";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  let adminRole = await prisma.role.findFirst({ where: { tenantId: null, name: "ADMIN" } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { tenantId: null, name: "ADMIN", label: ROLE_LABELS.ADMIN, permissions: ROLE_PERMISSIONS.ADMIN },
    });
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const tenant = await prisma.tenant.create({
    data: {
      name: data.companyName,
      slug,
      companyType: data.companyType,
      industry: data.industry,
      country: data.country,
      address: data.address,
      website: data.website,
      status: "TRIAL",
      trialEndsAt,
    },
  });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: data.adminName,
      email: data.email.toLowerCase(),
      phone: data.mobile,
      passwordHash,
      roleId: adminRole.id,
      title: "Company Admin",
    },
  });

  await prisma.pipelineStage.createMany({
    data: PIPELINE_STAGES.map((s) => ({
      tenantId: tenant.id,
      key: s.key,
      label: s.label,
      order: s.order,
      isClosed: !!s.isClosed,
      isWon: !!s.isWon,
    })),
  });

  await prisma.automationRule.createMany({
    data: [
      { tenantId: tenant.id, name: "Notify on stale lead", triggerType: "NO_ACTIVITY_DAYS", condition: { days: 2 }, action: { notify: ["owner", "manager"] } },
      { tenantId: tenant.id, name: "Require approval on high value deals", triggerType: "HIGH_VALUE", condition: { amount: 500000 }, action: { requireApproval: "HIGH_VALUE_OPPORTUNITY" } },
    ],
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      type: "NEW_LEAD",
      title: "Welcome to LeadFlow",
      message: "Your workspace is ready. Invite your team and create your first lead to get started.",
      link: "/app/dashboard",
    },
  });

  await logAudit({ tenantId: tenant.id, userId: admin.id, action: "CREATE", entityType: "Tenant", entityId: tenant.id, after: { name: tenant.name } });

  return { success: true };
}
