import { prisma } from "@/lib/prisma";

export async function getPlatformOverview() {
  const [tenants, totalUsers, activeUsers, totalLeads, totalOpportunities, revenueAgg] = await Promise.all([
    prisma.tenant.findMany({
      include: { _count: { select: { users: true, leads: true, opportunities: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { tenantId: { not: null } } }),
    prisma.user.count({ where: { tenantId: { not: null }, isActive: true } }),
    prisma.lead.count(),
    prisma.opportunity.count(),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const trial = tenants.filter((t) => t.status === "TRIAL").length;
  const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;

  return {
    tenants,
    kpis: {
      totalCompanies: tenants.length,
      activeCompanies: active,
      trialCompanies: trial,
      suspendedCompanies: suspended,
      totalUsers,
      activeUsers,
      totalLeads,
      totalOpportunities,
      platformRevenue: revenueAgg._sum.amount ?? 0,
    },
  };
}
