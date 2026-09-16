"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { can, type Role } from "@/lib/rbac";
import clsx from "clsx";

const GROUPS: { title: string; items: string[] }[] = [
  { title: "Overview", items: ["Dashboard", "Daily Planning"] },
  {
    title: "Maintenance",
    items: ["Maintenance", "PM", "CM", "Work Orders", "Equipment", "Inspections", "Findings", "Actions"],
  },
  { title: "Compliance", items: ["SCE", "HSE", "QC/QA"] },
  { title: "Workforce", items: ["Man-Hours", "Timesheet"] },
  { title: "Reporting", items: ["KPI Management", "Reports", "Excel Import/Export", "Documents"] },
  { title: "System", items: ["Notifications", "Administration", "Audit Trail"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="no-print flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface py-4">
      <div className="px-4 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            M
          </span>
          <span className="text-sm font-semibold leading-tight text-ink-strong">
            Maintenance &amp; KPI MS
          </span>
        </Link>
      </div>

      {GROUPS.map((group) => {
        const items = NAV_ITEMS.filter(
          (i) => group.items.includes(i.label) && can(role, i.module, "read")
        );
        if (items.length === 0) return null;

        return (
          <div key={group.title} className="mb-3 px-3">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "block rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "text-ink-soft hover:bg-surface-subtle hover:text-ink-strong"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
