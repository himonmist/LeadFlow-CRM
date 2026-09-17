import type { Entity } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  KanbanSquare,
  FileText,
  ClipboardCheck,
  Wrench,
  GraduationCap,
  CalendarDays,
  Receipt,
  Wallet,
  BarChart3,
  Bell,
  History,
  UsersRound,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  entity?: Entity;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "CRM",
    items: [
      { href: "/app/leads", label: "Leads", icon: Users, entity: "lead" },
      { href: "/app/customers", label: "Customers", icon: Building2, entity: "customer" },
      { href: "/app/opportunities", label: "Opportunities", icon: Target, entity: "opportunity" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare, entity: "opportunity" },
      { href: "/app/quotations", label: "Quotations", icon: FileText, entity: "quotation" },
      { href: "/app/approvals", label: "Approvals", icon: ClipboardCheck, entity: "approval" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { href: "/app/services", label: "Services", icon: Wrench, entity: "service" },
      { href: "/app/training", label: "Training", icon: GraduationCap, entity: "training" },
      { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/app/finance/invoices", label: "Invoices", icon: Receipt, entity: "invoice" },
      { href: "/app/finance/payments", label: "Payments", icon: Wallet, entity: "payment" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/app/reports", label: "Reports", icon: BarChart3, entity: "report" },
      { href: "/app/notifications", label: "Notifications", icon: Bell },
      { href: "/app/audit-log", label: "Audit Log", icon: History },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/app/team", label: "Team", icon: UsersRound, entity: "user" },
      { href: "/app/settings", label: "Settings", icon: Settings, entity: "settings" },
    ],
  },
];
