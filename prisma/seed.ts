import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "../src/lib/permissions";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

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

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function hashPassword() {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}

async function ensureRoles() {
  const passwordHash = await hashPassword();
  const roleNames = Object.keys(ROLE_LABELS) as RoleName[];
  const roles: Record<string, string> = {};
  for (const name of roleNames) {
    const role = await prisma.role.create({
      data: {
        tenantId: null,
        name,
        label: ROLE_LABELS[name],
        permissions: ROLE_PERMISSIONS[name] ?? {},
      },
    });
    roles[name] = role.id;
  }
  return { roles, passwordHash };
}

async function buildTenant(opts: {
  name: string;
  slug: string;
  industry: string;
  country: string;
  status: "TRIAL" | "ACTIVE";
  planTier: "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";
  roles: Record<string, string>;
  passwordHash: string;
}) {
  const tenant = await prisma.tenant.create({
    data: {
      name: opts.name,
      slug: opts.slug,
      industry: opts.industry,
      country: opts.country,
      companyType: "Private Limited",
      website: `https://${opts.slug}.example.com`,
      address: "Level 4, Corporate Tower, " + opts.country,
      status: opts.status,
      planTier: opts.planTier,
      trialEndsAt: opts.status === "TRIAL" ? daysFromNow(14) : null,
    },
  });

  const [admin, manager, marketing, sales, trainer, finance, viewer] = await Promise.all([
    prisma.user.create({
      data: { tenantId: tenant.id, name: `${opts.name.split(" ")[0]} Admin`, email: `admin@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.ADMIN, title: "Company Admin" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Nasrin Akter", email: `manager@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.MANAGER, title: "Sales Manager" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Karim Uddin", email: `marketing@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.MARKETING, title: "Marketing Executive" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Rahim Chowdhury", email: `sales@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.SALES, title: "Sales Executive" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Dr. Farah Islam", email: `trainer@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.TRAINER, title: "Lead Trainer" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Imran Kabir", email: `finance@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.FINANCE, title: "Finance Officer" },
    }),
    prisma.user.create({
      data: { tenantId: tenant.id, name: "Viewer Account", email: `viewer@${opts.slug}.com`, passwordHash: opts.passwordHash, roleId: opts.roles.VIEWER, title: "Observer" },
    }),
  ]);

  const stages = await Promise.all(
    PIPELINE_STAGES.map((s) =>
      prisma.pipelineStage.create({
        data: { tenantId: tenant.id, key: s.key, label: s.label, order: s.order, isClosed: !!s.isClosed, isWon: !!s.isWon },
      })
    )
  );
  const stageByKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  // ---- Customers & contacts -------------------------------------------------
  const customerDefs = [
    { name: "ABC Pharmaceuticals Ltd", industry: "Pharmaceuticals", city: "Dhaka", contacts: [["Dr. Salma Rahman", "Head of HR", true], ["Tanvir Alam", "Training Coordinator", false]] },
    { name: "Vertex Software Ltd", industry: "IT & Software", city: "Chattogram", contacts: [["Farid Hasan", "CTO", true]] },
    { name: "Northline Consulting Group", industry: "Consulting", city: "Dhaka", contacts: [["Shirin Akhtar", "Operations Director", true]] },
    { name: "Meridian Healthcare Services", industry: "Healthcare", city: "Sylhet", contacts: [["Dr. Anisur Haque", "Medical Director", true]] },
    { name: "Skyline Resource Partners", industry: "Staffing & Resourcing", city: "Dhaka", contacts: [["Nusrat Jahan", "HR Manager", true]] },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        industry: c.industry,
        city: c.city,
        country: opts.country,
        website: `https://${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
      },
    });
    for (const [name, designation, isPrimary] of c.contacts) {
      await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          name: name as string,
          designation: designation as string,
          isPrimary: isPrimary as boolean,
          email: `${(name as string).split(" ")[0].toLowerCase()}@${c.name.toLowerCase().split(" ")[0]}.com`,
          phone: "+880 1" + Math.floor(700000000 + Math.random() * 99999999),
        },
      });
    }
    customers.push(customer);
  }

  // ---- Leads ------------------------------------------------------------
  const owners = [manager, marketing, sales];
  const sources: Array<"WEBSITE" | "LINKEDIN" | "REFERRAL" | "EVENT" | "CAMPAIGN" | "EXISTING_CUSTOMER"> = [
    "WEBSITE",
    "LINKEDIN",
    "REFERRAL",
    "EVENT",
    "CAMPAIGN",
    "EXISTING_CUSTOMER",
  ];

  const leadDefs = [
    { company: customers[0], interest: "TRAINING" as const, status: "CONVERTED" as const, program: "AI-Powered Pharma Sales Excellence" },
    { company: customers[0], interest: "SERVICE" as const, status: "QUALIFIED" as const, program: "Field Force CRM Rollout" },
    { company: customers[1], interest: "SOFTWARE" as const, status: "CONVERTED" as const, program: "Custom Software Development" },
    { company: customers[1], interest: "RESOURCE_AUGMENTATION" as const, status: "CONTACTED" as const, program: "Resource Augmentation - 4 Engineers" },
    { company: customers[2], interest: "CONSULTING" as const, status: "NEW" as const, program: "Digital Transformation Advisory" },
    { company: customers[3], interest: "TRAINING" as const, status: "CONVERTED" as const, program: "Clinical Data Compliance Training" },
    { company: customers[4], interest: "SERVICE" as const, status: "NEW" as const, program: "Recruitment Process Outsourcing" },
  ];

  const leads = [];
  for (let i = 0; i < leadDefs.length; i++) {
    const d = leadDefs[i];
    const owner = owners[i % owners.length];
    const primaryContact = await prisma.contact.findFirst({ where: { customerId: d.company.id } });
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        leadNumber: `LD-${String(i + 1).padStart(4, "0")}`,
        leadDate: daysFromNow(-(20 - i * 2)),
        companyName: d.company.name,
        customerId: d.company.id,
        contactId: primaryContact?.id,
        designation: primaryContact?.designation,
        email: primaryContact?.email,
        mobile: primaryContact?.phone,
        industry: d.company.industry,
        country: opts.country,
        city: d.company.city,
        source: sources[i % sources.length],
        businessInterest: d.interest,
        status: d.status,
        priority: i % 3 === 0 ? "HIGH" : "MEDIUM",
        estimatedValue: 150000 + i * 45000,
        ownerId: owner.id,
        notes: `Initial interest in ${d.program}.`,
      },
    });
    leads.push({ lead, program: d.program, customer: d.company, owner });
  }

  // ---- Opportunities, Activities, Service/Training, Quotation/Invoice ----
  let opCounter = 1;
  const opportunities: any[] = [];

  async function makeOpportunity(input: {
    customerId: string;
    leadId?: string;
    requirement: string;
    engagementType: "SERVICE" | "TRAINING";
    programName?: string;
    value: number;
    probability: number;
    stageKey: string;
    ownerId: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    nextAction?: string;
    nextFollowUpDate?: Date;
  }) {
    const op = await prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        opportunityNo: `OP-${String(1000 + opCounter++)}`,
        customerId: input.customerId,
        leadId: input.leadId,
        requirement: input.requirement,
        engagementType: input.engagementType,
        programName: input.programName,
        estimatedValue: input.value,
        probability: input.probability,
        expectedCloseDate: daysFromNow(15),
        ownerId: input.ownerId,
        stageId: stageByKey[input.stageKey].id,
        priority: input.priority ?? "MEDIUM",
        nextAction: input.nextAction,
        nextFollowUpDate: input.nextFollowUpDate,
      },
    });
    opportunities.push(op);
    return op;
  }

  async function addActivity(input: {
    type: any;
    daysAgo: number;
    subject: string;
    outcome?: string;
    status?: "PLANNED" | "COMPLETED" | "CANCELLED";
    leadId?: string;
    opportunityId?: string;
    customerId?: string;
    assignedToId: string;
    nextAction?: string;
    nextFollowUpDaysFromNow?: number;
  }) {
    return prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: input.type,
        date: daysFromNow(-input.daysAgo),
        startTime: "10:00",
        endTime: "10:30",
        subject: input.subject,
        outcome: input.outcome,
        status: input.status ?? "COMPLETED",
        leadId: input.leadId,
        opportunityId: input.opportunityId,
        customerId: input.customerId,
        assignedToId: input.assignedToId,
        nextAction: input.nextAction,
        nextFollowUpDate:
          input.nextFollowUpDaysFromNow !== undefined ? daysFromNow(input.nextFollowUpDaysFromNow) : undefined,
      },
    });
  }

  // 1) Won TRAINING opportunity -> TrainingProgram + Invoice (partially paid)
  const pharmaLead = leads[0];
  const trainingOp = await makeOpportunity({
    customerId: pharmaLead.customer.id,
    leadId: pharmaLead.lead.id,
    requirement: "35-participant AI sales training for field force",
    engagementType: "TRAINING",
    programName: "AI-Powered Pharma Sales Excellence",
    value: 250000,
    probability: 100,
    stageKey: "WON",
    ownerId: pharmaLead.owner.id,
    priority: "HIGH",
  });
  await addActivity({ type: "PHONE_CALL", daysAgo: 18, subject: "Discovery call", outcome: "Customer requested a tailored AI sales training for 35 participants.", leadId: pharmaLead.lead.id, opportunityId: trainingOp.id, customerId: pharmaLead.customer.id, assignedToId: pharmaLead.owner.id });
  await addActivity({ type: "ONLINE_MEETING", daysAgo: 15, subject: "Requirement discussion", outcome: "Confirmed curriculum outline and participant count.", opportunityId: trainingOp.id, customerId: pharmaLead.customer.id, assignedToId: pharmaLead.owner.id });
  await addActivity({ type: "PROPOSAL_SENT", daysAgo: 12, subject: "Proposal sent", outcome: "Sent proposal for AI-Powered Pharma Sales Excellence.", opportunityId: trainingOp.id, customerId: pharmaLead.customer.id, assignedToId: pharmaLead.owner.id });
  await addActivity({ type: "TRAINING_DISCUSSION", daysAgo: 8, subject: "Negotiation call", outcome: "Agreed on final fee of BDT 250,000.", opportunityId: trainingOp.id, customerId: pharmaLead.customer.id, assignedToId: pharmaLead.owner.id });

  const training = await prisma.trainingProgram.create({
    data: {
      tenantId: tenant.id,
      opportunityId: trainingOp.id,
      customerId: pharmaLead.customer.id,
      programName: "AI-Powered Pharma Sales Excellence",
      category: "Sales Enablement",
      trainerId: trainer.id,
      deliveryMode: "PHYSICAL",
      trainingDate: daysFromNow(5),
      startTime: "10:00",
      endTime: "17:00",
      durationHours: 7,
      venue: "Client Training Center, Dhaka",
      participants: 35,
      coordinator: "Tanvir Alam",
      fee: 250000,
      discount: 10000,
      tax: 12000,
      status: "CONFIRMED",
    },
  });

  const trainingQuotation = await prisma.quotation.create({
    data: {
      tenantId: tenant.id,
      quotationNo: "QT-0001",
      customerId: pharmaLead.customer.id,
      opportunityId: trainingOp.id,
      status: "APPROVED",
      validUntil: daysFromNow(10),
      terms: "50% advance, balance on completion. Valid for 30 days.",
      subtotal: 250000,
      discount: 10000,
      tax: 12000,
      total: 252000,
      items: {
        create: [{ description: "AI-Powered Pharma Sales Excellence — 35 participants", quantity: 35, unitPrice: 250000 / 35, total: 250000 }],
      },
    },
  });

  const trainingInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNo: "INV-0001",
      customerId: pharmaLead.customer.id,
      opportunityId: trainingOp.id,
      quotationId: trainingQuotation.id,
      status: "PARTIALLY_PAID",
      issueDate: daysFromNow(-3),
      dueDate: daysFromNow(12),
      paymentTerms: "50% advance, balance on completion",
      subtotal: 250000,
      discount: 10000,
      tax: 12000,
      total: 252000,
      paidAmount: 126000,
      items: {
        create: [{ description: "AI-Powered Pharma Sales Excellence — Training Fee", quantity: 1, unitPrice: 252000, total: 252000 }],
      },
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: trainingInvoice.id,
      amount: 126000,
      paymentDate: daysFromNow(-2),
      method: "Bank Transfer",
      reference: "TXN-88213",
    },
  });

  // 2) Won SERVICE opportunity -> Service delivery + fully paid Invoice
  const vertexLead = leads[2];
  const serviceOp = await makeOpportunity({
    customerId: vertexLead.customer.id,
    leadId: vertexLead.lead.id,
    requirement: "Custom CRM & inventory software build",
    engagementType: "SERVICE",
    programName: "Custom Software Development",
    value: 850000,
    probability: 100,
    stageKey: "WON",
    ownerId: vertexLead.owner.id,
    priority: "HIGH",
  });
  await addActivity({ type: "DEMO", daysAgo: 25, subject: "Product demo", outcome: "Positive feedback, requested formal proposal.", opportunityId: serviceOp.id, customerId: vertexLead.customer.id, assignedToId: vertexLead.owner.id });
  await addActivity({ type: "QUOTATION_SENT", daysAgo: 20, subject: "Quotation sent", outcome: "Quotation shared for review.", opportunityId: serviceOp.id, customerId: vertexLead.customer.id, assignedToId: vertexLead.owner.id });
  await addActivity({ type: "CONTRACT_DISCUSSION", daysAgo: 10, subject: "Contract finalized", outcome: "Signed contract for BDT 850,000.", opportunityId: serviceOp.id, customerId: vertexLead.customer.id, assignedToId: vertexLead.owner.id });

  const service = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      opportunityId: serviceOp.id,
      customerId: vertexLead.customer.id,
      name: "Custom Software Development",
      category: "Software Engineering",
      description: "Bespoke CRM and inventory management platform.",
      startDate: daysFromNow(-5),
      expectedDeliveryDate: daysFromNow(45),
      projectManagerId: manager.id,
      assignedTeam: "Engineering Pod 2",
      status: "IN_PROGRESS",
      value: 850000,
      discount: 25000,
      tax: 41250,
      paymentTerms: "30% advance, 40% mid-delivery, 30% on go-live",
    },
  });

  const serviceInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNo: "INV-0002",
      customerId: vertexLead.customer.id,
      opportunityId: serviceOp.id,
      status: "PAID",
      issueDate: daysFromNow(-5),
      dueDate: daysFromNow(-1),
      paymentTerms: "30% advance",
      subtotal: 255000,
      discount: 0,
      tax: 12750,
      total: 267750,
      paidAmount: 267750,
      items: {
        create: [{ description: "Custom Software Development — Advance (30%)", quantity: 1, unitPrice: 267750, total: 267750 }],
      },
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: serviceInvoice.id,
      amount: 267750,
      paymentDate: daysFromNow(-4),
      method: "Bank Transfer",
      reference: "TXN-77410",
    },
  });

  // 3) Active pipeline opportunities across various stages (with overdue/today follow-ups)
  const pharmaServiceLead = leads[1];
  await makeOpportunity({
    customerId: pharmaServiceLead.customer.id,
    leadId: pharmaServiceLead.lead.id,
    requirement: "CRM rollout for 60-member field force",
    engagementType: "SERVICE",
    programName: "Field Force CRM Rollout",
    value: 420000,
    probability: 60,
    stageKey: "PROPOSAL",
    ownerId: pharmaServiceLead.owner.id,
    nextAction: "Send revised proposal",
    nextFollowUpDate: daysFromNow(0),
  });
  await addActivity({ type: "PHONE_CALL", daysAgo: 1, subject: "Follow-up call", outcome: "Customer requested revised proposal with phased rollout.", leadId: pharmaServiceLead.lead.id, customerId: pharmaServiceLead.customer.id, assignedToId: pharmaServiceLead.owner.id, nextAction: "Send revised proposal", nextFollowUpDaysFromNow: 0 });

  const vertexOpp2Lead = leads[3];
  await makeOpportunity({
    customerId: vertexOpp2Lead.customer.id,
    leadId: vertexOpp2Lead.lead.id,
    requirement: "4 senior engineers for 6-month augmentation",
    engagementType: "SERVICE",
    programName: "Resource Augmentation",
    value: 960000,
    probability: 40,
    stageKey: "NEGOTIATION",
    ownerId: vertexOpp2Lead.owner.id,
    priority: "HIGH",
    nextAction: "Manager review — high value deal",
    nextFollowUpDate: daysFromNow(-2),
  });

  const northlineLead = leads[4];
  await makeOpportunity({
    customerId: northlineLead.customer.id,
    leadId: northlineLead.lead.id,
    requirement: "Digital transformation roadmap",
    engagementType: "SERVICE",
    programName: "Digital Transformation Advisory",
    value: 300000,
    probability: 20,
    stageKey: "NEW",
    ownerId: northlineLead.owner.id,
    nextAction: "Initial discovery call",
    nextFollowUpDate: daysFromNow(1),
  });

  const meridianLead = leads[5];
  const meridianOp = await makeOpportunity({
    customerId: meridianLead.customer.id,
    leadId: meridianLead.lead.id,
    requirement: "Compliance training for 50 clinical staff",
    engagementType: "TRAINING",
    programName: "Clinical Data Compliance Training",
    value: 180000,
    probability: 100,
    stageKey: "WON",
    ownerId: meridianLead.owner.id,
  });
  await prisma.trainingProgram.create({
    data: {
      tenantId: tenant.id,
      opportunityId: meridianOp.id,
      customerId: meridianLead.customer.id,
      programName: "Clinical Data Compliance Training",
      category: "Compliance",
      trainerId: trainer.id,
      deliveryMode: "ONLINE",
      trainingDate: daysFromNow(-2),
      startTime: "09:00",
      endTime: "13:00",
      durationHours: 4,
      meetingLink: "https://meet.example.com/clinical-compliance",
      participants: 50,
      coordinator: "Dr. Anisur Haque",
      fee: 180000,
      status: "COMPLETED",
    },
  });

  const skylineLead = leads[6];
  await makeOpportunity({
    customerId: skylineLead.customer.id,
    leadId: skylineLead.lead.id,
    requirement: "RPO engagement for 25 hires/quarter",
    engagementType: "SERVICE",
    programName: "Recruitment Process Outsourcing",
    value: 500000,
    probability: 20,
    stageKey: "QUALIFIED",
    ownerId: skylineLead.owner.id,
    nextAction: "Send capability deck",
    nextFollowUpDate: daysFromNow(-1),
  });

  // A lost and a postponed opportunity for pipeline/report realism
  await makeOpportunity({
    customerId: customers[1].id,
    requirement: "Legacy system migration",
    engagementType: "SERVICE",
    programName: "Legacy Migration",
    value: 220000,
    probability: 0,
    stageKey: "LOST",
    ownerId: sales.id,
  });
  await makeOpportunity({
    customerId: customers[2].id,
    requirement: "Leadership training cohort",
    engagementType: "TRAINING",
    programName: "Leadership Excellence Program",
    value: 140000,
    probability: 30,
    stageKey: "POSTPONED",
    ownerId: marketing.id,
  });

  // ---- Approval (manager review of high-value deal) ----------------------
  const highValueOpp = opportunities.find((o) => o.programName === "Resource Augmentation");
  if (highValueOpp) {
    await prisma.approval.create({
      data: {
        tenantId: tenant.id,
        type: "HIGH_VALUE_OPPORTUNITY",
        status: "PENDING",
        opportunityId: highValueOpp.id,
        requestedById: sales.id,
        reason: "Opportunity value (BDT 960,000) exceeds the BDT 500,000 auto-approval threshold.",
      },
    });
  }

  // ---- Notifications -------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { tenantId: tenant.id, userId: manager.id, type: "APPROVAL_REQUEST", title: "Approval requested", message: "Rahim requested approval for a BDT 960,000 opportunity.", link: "/app/approvals" },
      { tenantId: tenant.id, userId: sales.id, type: "OVERDUE_FOLLOW_UP", title: "Overdue follow-up", message: "Follow-up with Vertex Software Ltd is overdue by 2 days.", link: "/app/opportunities" },
      { tenantId: tenant.id, userId: trainer.id, type: "TRAINING_REMINDER", title: "Training reminder", message: "AI-Powered Pharma Sales Excellence starts in 5 days.", link: "/app/training" },
      { tenantId: tenant.id, userId: finance.id, type: "INVOICE_GENERATED", title: "Invoice generated", message: "Invoice INV-0002 generated for Vertex Software Ltd.", link: "/app/finance/invoices" },
      { tenantId: tenant.id, userId: admin.id, type: "DEAL_WON", title: "Deal won", message: "Custom Software Development (BDT 850,000) marked as Won.", link: "/app/opportunities" },
    ],
  });

  // ---- Automation rules ------------------------------------------------
  await prisma.automationRule.createMany({
    data: [
      { tenantId: tenant.id, name: "Notify on stale lead", triggerType: "NO_ACTIVITY_DAYS", condition: { days: 2 }, action: { notify: ["owner", "manager"] } },
      { tenantId: tenant.id, name: "Require approval on high value deals", triggerType: "HIGH_VALUE", condition: { amount: 500000 }, action: { requireApproval: "HIGH_VALUE_OPPORTUNITY" } },
      { tenantId: tenant.id, name: "Training tomorrow reminder", triggerType: "TRAINING_TOMORROW", condition: {}, action: { notify: ["trainer", "coordinator", "manager"] } },
      { tenantId: tenant.id, name: "Overdue invoice alert", triggerType: "INVOICE_OVERDUE", condition: {}, action: { notify: ["finance", "owner"] } },
    ],
  });

  // ---- Audit log ---------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      { tenantId: tenant.id, userId: admin.id, action: "CREATE", entityType: "Tenant", entityId: tenant.id, after: { name: tenant.name } },
      { tenantId: tenant.id, userId: sales.id, action: "STATUS_CHANGE", entityType: "Opportunity", entityId: serviceOp.id, before: { stage: "NEGOTIATION" }, after: { stage: "WON" } },
      { tenantId: tenant.id, userId: finance.id, action: "CREATE", entityType: "Invoice", entityId: trainingInvoice.id, after: { invoiceNo: "INV-0001", total: 252000 } },
      { tenantId: tenant.id, userId: finance.id, action: "PAYMENT", entityType: "Invoice", entityId: trainingInvoice.id, after: { amount: 126000 } },
    ],
  });

  return { tenant, admin };
}

async function main() {
  console.log("Seeding LeadFlow CRM demo data...");
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.trainingProgram.deleteMany();
  await prisma.service.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.role.deleteMany();

  const { roles, passwordHash } = await ensureRoles();

  await buildTenant({
    name: "Bright Pharma Solutions",
    slug: "brightpharma",
    industry: "Pharmaceuticals & Training",
    country: "Bangladesh",
    status: "ACTIVE",
    planTier: "PROFESSIONAL",
    roles,
    passwordHash,
  });

  await buildTenant({
    name: "Vertex Software Ltd",
    slug: "vertexsoft",
    industry: "IT & Software",
    country: "Bangladesh",
    status: "TRIAL",
    planTier: "STARTER",
    roles,
    passwordHash,
  });

  const superAdmin = await prisma.user.create({
    data: {
      tenantId: null,
      name: "Platform Super Admin",
      email: "superadmin@leadflow.com",
      passwordHash,
      roleId: roles.SUPER_ADMIN,
      title: "Super Admin",
    },
  });

  console.log("Seed complete.");
  console.log("Demo login password for every user:", DEMO_PASSWORD);
  console.log("Super admin:", superAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
