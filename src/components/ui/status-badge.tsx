import clsx from "clsx";

// Spec section 59: status must never rely on color alone - every badge
// carries text, and the color mapping is centralized here so it stays
// configurable/consistent across modules.
const STATUS_STYLES: Record<string, string> = {
  // maintenance workflow
  PLANNED: "bg-surface-subtle text-ink-soft dark:bg-slate-800 dark:text-slate-300",
  ASSIGNED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PARTIALLY_COMPLETED: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  RESCHEDULED: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  CANCELLED: "bg-surface-subtle text-ink-muted line-through dark:bg-slate-800 dark:text-ink-faint",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  VERIFIED: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  CLOSED: "bg-surface-subtle text-ink-soft dark:bg-slate-700 dark:text-slate-300",
  // tracker workflow (finding / action / ncr / observation)
  OPEN: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  // sce
  DUE: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  // generic
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INACTIVE: "bg-surface-subtle text-ink-muted dark:bg-slate-800 dark:text-ink-faint",
  PASS: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  FAIL: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  CONDITIONAL: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PENDING: "bg-surface-subtle text-ink-soft dark:bg-slate-800 dark:text-slate-300",
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-surface-subtle text-ink-soft dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      {humanize(status)}
    </span>
  );
}
