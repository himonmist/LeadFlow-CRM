// Central definition of the permission matrix (section 25/32 of the spec).
// Each role maps to a set of entity -> allowed actions. Super Admin bypasses
// this entirely (platform-level access, not tenant-scoped).

export type Action = "view" | "create" | "edit" | "delete" | "assign" | "approve" | "export" | "cancel";

export type Entity =
  | "lead"
  | "customer"
  | "opportunity"
  | "activity"
  | "service"
  | "training"
  | "quotation"
  | "invoice"
  | "payment"
  | "report"
  | "settings"
  | "user"
  | "approval";

export type PermissionMatrix = Record<Entity, Action[]>;

const ALL: Action[] = ["view", "create", "edit", "delete", "assign", "approve", "export", "cancel"];
const CRUD: Action[] = ["view", "create", "edit"];
const VIEW: Action[] = ["view"];

export const ROLE_PERMISSIONS: Record<string, PermissionMatrix> = {
  ADMIN: {
    lead: ALL,
    customer: ALL,
    opportunity: ALL,
    activity: ALL,
    service: ALL,
    training: ALL,
    quotation: ALL,
    invoice: ALL,
    payment: ALL,
    report: ["view", "export"],
    settings: ALL,
    user: ALL,
    approval: ["view", "approve"],
  },
  MANAGER: {
    lead: ["view", "create", "edit", "assign", "export"],
    customer: ["view", "create", "edit", "export"],
    opportunity: ["view", "create", "edit", "assign", "export"],
    activity: ["view", "create", "edit"],
    service: ["view", "create", "edit"],
    training: ["view", "create", "edit"],
    quotation: ["view", "create", "edit", "approve"],
    invoice: ["view", "create", "approve"],
    payment: ["view", "create"],
    report: ["view", "export"],
    settings: VIEW,
    user: VIEW,
    approval: ["view", "approve"],
  },
  MARKETING: {
    lead: ["view", "create", "edit"],
    customer: ["view", "create", "edit"],
    opportunity: ["view", "create", "edit"],
    activity: ["view", "create", "edit"],
    service: VIEW,
    training: VIEW,
    quotation: ["view", "create"],
    invoice: VIEW,
    payment: VIEW,
    report: VIEW,
    settings: [],
    user: [],
    approval: VIEW,
  },
  SALES: {
    lead: ["view", "create", "edit"],
    customer: ["view", "create", "edit"],
    opportunity: ["view", "create", "edit"],
    activity: ["view", "create", "edit"],
    service: VIEW,
    training: VIEW,
    quotation: ["view", "create"],
    invoice: VIEW,
    payment: VIEW,
    report: VIEW,
    settings: [],
    user: [],
    approval: VIEW,
  },
  TRAINER: {
    lead: [],
    customer: VIEW,
    opportunity: VIEW,
    activity: CRUD,
    service: VIEW,
    training: ["view", "edit"],
    quotation: [],
    invoice: [],
    payment: [],
    report: VIEW,
    settings: [],
    user: [],
    approval: [],
  },
  FINANCE: {
    lead: VIEW,
    customer: VIEW,
    opportunity: VIEW,
    activity: VIEW,
    service: VIEW,
    training: VIEW,
    quotation: ["view", "create", "edit", "approve"],
    invoice: ALL,
    payment: ALL,
    report: ["view", "export"],
    settings: VIEW,
    user: [],
    approval: ["view", "approve"],
  },
  VIEWER: {
    lead: VIEW,
    customer: VIEW,
    opportunity: VIEW,
    activity: VIEW,
    service: VIEW,
    training: VIEW,
    quotation: VIEW,
    invoice: VIEW,
    payment: VIEW,
    report: VIEW,
    settings: [],
    user: [],
    approval: VIEW,
  },
};

export function can(permissions: PermissionMatrix | undefined, entity: Entity, action: Action): boolean {
  if (!permissions) return false;
  return permissions[entity]?.includes(action) ?? false;
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Company Admin",
  MANAGER: "Manager",
  MARKETING: "Marketing Executive",
  SALES: "Sales Executive",
  TRAINER: "Trainer",
  FINANCE: "Finance",
  VIEWER: "Viewer",
};

export const DEFAULT_DASHBOARD_PATH: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/app/dashboard",
  MANAGER: "/app/dashboard",
  MARKETING: "/app/dashboard",
  SALES: "/app/dashboard",
  TRAINER: "/app/training",
  FINANCE: "/app/finance/invoices",
  VIEWER: "/app/dashboard",
};
