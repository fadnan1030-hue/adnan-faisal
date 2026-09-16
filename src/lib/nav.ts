import type { Module } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  module: Module;
}

// Main navigation (spec section 7)
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", module: "DASHBOARD" },
  { label: "Daily Planning", href: "/daily-planning", module: "DAILY_PLANNING" },
  { label: "Maintenance", href: "/maintenance", module: "MAINTENANCE" },
  { label: "PM", href: "/pm", module: "MAINTENANCE" },
  { label: "CM", href: "/cm", module: "MAINTENANCE" },
  { label: "Work Orders", href: "/work-orders", module: "MAINTENANCE" },
  { label: "Equipment", href: "/equipment", module: "EQUIPMENT" },
  { label: "Inspections", href: "/inspections", module: "INSPECTIONS" },
  { label: "Findings", href: "/findings", module: "FINDINGS" },
  { label: "Actions", href: "/actions", module: "ACTIONS" },
  { label: "SCE", href: "/sce", module: "SCE" },
  { label: "HSE", href: "/hse", module: "HSE" },
  { label: "QC/QA", href: "/qc", module: "QC" },
  { label: "Man-Hours", href: "/man-hours", module: "MAN_HOURS" },
  { label: "Timesheet", href: "/timesheet", module: "TIMESHEET" },
  { label: "KPI Management", href: "/kpi", module: "KPI_MANAGEMENT" },
  { label: "Reports", href: "/reports", module: "REPORTS" },
  { label: "Excel Import/Export", href: "/excel", module: "EXCEL_IO" },
  { label: "Documents", href: "/documents", module: "DOCUMENTS" },
  { label: "Notifications", href: "/notifications", module: "NOTIFICATIONS" },
  { label: "Administration", href: "/admin", module: "ADMINISTRATION" },
  { label: "Audit Trail", href: "/admin/audit", module: "AUDIT_TRAIL" },
];
