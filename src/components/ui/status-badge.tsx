import clsx from "clsx";

// Spec section 59: status must never rely on color alone - every badge
// carries text, and the color mapping is centralized here so it stays
// configurable/consistent across modules.
const STATUS_STYLES: Record<string, string> = {
  // maintenance workflow
  PLANNED: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PARTIALLY_COMPLETED: "bg-amber-50 text-amber-700",
  RESCHEDULED: "bg-purple-50 text-purple-700",
  CANCELLED: "bg-slate-100 text-slate-500 line-through",
  OVERDUE: "bg-red-50 text-red-700",
  VERIFIED: "bg-teal-50 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-600",
  // tracker workflow (finding / action / ncr / observation)
  OPEN: "bg-blue-50 text-blue-700",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
  // sce
  DUE: "bg-amber-50 text-amber-700",
  // generic
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  PASS: "bg-emerald-50 text-emerald-700",
  FAIL: "bg-red-50 text-red-700",
  CONDITIONAL: "bg-amber-50 text-amber-700",
  PENDING: "bg-slate-100 text-slate-600",
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
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {humanize(status)}
    </span>
  );
}
