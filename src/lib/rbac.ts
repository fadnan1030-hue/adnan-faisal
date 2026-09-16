// Role-based access control matrix (spec section 5).
//
// This governs module-level navigation/page access. It is deliberately a
// coarse role -> module -> access-level table rather than a full dynamic
// permissions engine (spec's `roles`/`permissions` tables) - building a
// fully data-driven ACL editor is tracked as a roadmap item in README.md.
// Field-level restrictions (e.g. Viewer never seeing employee personal
// data or internal remarks) are additionally enforced at the query layer
// where noted.

export type Role =
  | "ADMIN"
  | "MAINTENANCE_MANAGER"
  | "MAINTENANCE_ENGINEER"
  | "SUPERVISOR"
  | "TECHNICIAN"
  | "HSE_USER"
  | "QC_USER"
  | "MANAGEMENT"
  | "VIEWER";

export type Module =
  | "DASHBOARD"
  | "DAILY_PLANNING"
  | "MAINTENANCE"
  | "EQUIPMENT"
  | "INSPECTIONS"
  | "FINDINGS"
  | "ACTIONS"
  | "SCE"
  | "HSE"
  | "QC"
  | "MAN_HOURS"
  | "TIMESHEET"
  | "KPI_MANAGEMENT"
  | "REPORTS"
  | "EXCEL_IO"
  | "DOCUMENTS"
  | "NOTIFICATIONS"
  | "ADMINISTRATION"
  | "AUDIT_TRAIL";

export type AccessLevel = "none" | "read" | "write" | "full";

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, read: 1, write: 2, full: 3 };

type Matrix = Record<Role, Partial<Record<Module, AccessLevel>>>;

const ALL_READ: Partial<Record<Module, AccessLevel>> = {
  DASHBOARD: "read",
  DAILY_PLANNING: "read",
  MAINTENANCE: "read",
  EQUIPMENT: "read",
  INSPECTIONS: "read",
  FINDINGS: "read",
  ACTIONS: "read",
  SCE: "read",
  HSE: "read",
  QC: "read",
  MAN_HOURS: "read",
  TIMESHEET: "read",
  KPI_MANAGEMENT: "read",
  REPORTS: "read",
  DOCUMENTS: "read",
  NOTIFICATIONS: "read",
};

export const PERMISSION_MATRIX: Matrix = {
  ADMIN: {
    DASHBOARD: "full",
    DAILY_PLANNING: "full",
    MAINTENANCE: "full",
    EQUIPMENT: "full",
    INSPECTIONS: "full",
    FINDINGS: "full",
    ACTIONS: "full",
    SCE: "full",
    HSE: "full",
    QC: "full",
    MAN_HOURS: "full",
    TIMESHEET: "full",
    KPI_MANAGEMENT: "full",
    REPORTS: "full",
    EXCEL_IO: "full",
    DOCUMENTS: "full",
    NOTIFICATIONS: "full",
    ADMINISTRATION: "full",
    AUDIT_TRAIL: "full",
  },
  MAINTENANCE_MANAGER: {
    ...ALL_READ,
    DAILY_PLANNING: "full",
    MAINTENANCE: "full",
    EQUIPMENT: "full",
    FINDINGS: "full",
    ACTIONS: "full",
    SCE: "full",
    KPI_MANAGEMENT: "write",
    REPORTS: "full",
    EXCEL_IO: "full",
    DOCUMENTS: "write",
  },
  MAINTENANCE_ENGINEER: {
    ...ALL_READ,
    DAILY_PLANNING: "write",
    MAINTENANCE: "write",
    EQUIPMENT: "write",
    FINDINGS: "write",
    ACTIONS: "write",
    DOCUMENTS: "write",
    EXCEL_IO: "write",
  },
  SUPERVISOR: {
    ...ALL_READ,
    MAINTENANCE: "write",
    FINDINGS: "write",
    ACTIONS: "write",
    DAILY_PLANNING: "write",
  },
  TECHNICIAN: {
    DASHBOARD: "read",
    DAILY_PLANNING: "read",
    MAINTENANCE: "write",
    EQUIPMENT: "read",
    FINDINGS: "write",
    ACTIONS: "write",
    DOCUMENTS: "write",
    NOTIFICATIONS: "read",
  },
  HSE_USER: {
    ...ALL_READ,
    HSE: "full",
    ACTIONS: "write",
    DOCUMENTS: "write",
    EXCEL_IO: "write",
  },
  QC_USER: {
    ...ALL_READ,
    QC: "full",
    ACTIONS: "write",
    DOCUMENTS: "write",
    EXCEL_IO: "write",
  },
  MANAGEMENT: {
    DASHBOARD: "read",
    REPORTS: "read",
    KPI_MANAGEMENT: "read",
    MAINTENANCE: "read",
    EQUIPMENT: "read",
    SCE: "read",
    HSE: "read",
    QC: "read",
    MAN_HOURS: "read",
    ACTIONS: "read",
    FINDINGS: "read",
    EXCEL_IO: "read",
    NOTIFICATIONS: "read",
  },
  VIEWER: {
    DASHBOARD: "read",
    REPORTS: "read",
  },
};

export function accessLevel(role: Role, module: Module): AccessLevel {
  return PERMISSION_MATRIX[role]?.[module] ?? "none";
}

export function can(role: Role, module: Module, required: AccessLevel = "read"): boolean {
  return LEVEL_RANK[accessLevel(role, module)] >= LEVEL_RANK[required];
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MAINTENANCE_MANAGER: "Maintenance Manager",
  MAINTENANCE_ENGINEER: "Maintenance Engineer",
  SUPERVISOR: "Supervisor",
  TECHNICIAN: "Technician",
  HSE_USER: "HSE User",
  QC_USER: "QC/QA User",
  MANAGEMENT: "Management",
  VIEWER: "External / View Only",
};

export const ALL_ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];
