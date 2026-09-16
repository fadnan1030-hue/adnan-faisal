import Link from "next/link";
import clsx from "clsx";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getManHourKpis, getMaintenanceKpis } from "@/lib/kpi/engine";
import { resolvePeriod, PERIOD_LABELS, type PeriodType } from "@/lib/kpi/period";
import { getManHourTrend } from "@/lib/kpi/trends";
import { ManHourTrendChart } from "@/components/dashboard/dashboard-charts";
import { formatHours, formatNumber } from "@/lib/format";

const PERIOD_TYPES: PeriodType[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export default async function ManHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireModuleAccess("MAN_HOURS", "read");
  const projectId = await getCurrentProjectId();
  const { period: periodParam } = await searchParams;
  const period: PeriodType = PERIOD_TYPES.includes(periodParam as PeriodType) ? (periodParam as PeriodType) : "MONTHLY";

  if (!projectId) {
    return (
      <div>
        <PageHeader title="Man-Hours" />
        <p className="text-sm text-ink-faint">Select a project.</p>
      </div>
    );
  }

  const range = resolvePeriod(period);

  const [manHours, maintenance, trend, contractorCount] = await Promise.all([
    getManHourKpis(projectId, range),
    getMaintenanceKpis(projectId, range),
    getManHourTrend(projectId, 6),
    prisma.contractor.count({ where: { projectId, active: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Man-Hours"
        description="Spec section 32 — normal, overtime, planned vs actual maintenance man-hours."
      />

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1 w-fit">
        {PERIOD_TYPES.map((p) => (
          <Link
            key={p}
            href={`?period=${p}`}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              period === p ? "bg-indigo-600 text-white" : "text-ink-soft hover:bg-surface-subtle"
            )}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Normal Hours" value={formatHours(manHours.normalHours)} />
        <StatCard label="Overtime Hours" value={formatHours(manHours.overtimeHours)} />
        <StatCard label="Total Hours" value={formatHours(manHours.totalHours)} />
        <StatCard label="Employees Recorded" value={formatNumber(manHours.employeeCount)} />
        <StatCard label="Planned Maintenance Hours" value={formatHours(maintenance.plannedHours)} />
        <StatCard label="Actual Maintenance Hours" value={formatHours(maintenance.actualHours)} />
        <StatCard
          label="Man-Hour Variance"
          value={maintenance.manHourVariance === null ? "N/A" : formatHours(maintenance.manHourVariance)}
          tone={maintenance.manHourVariance !== null && maintenance.manHourVariance > 0 ? "warning" : "good"}
        />
        <StatCard label="Active Contractors" value={String(contractorCount)} />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink">6-Month Man-Hour Trend</h3>
        <ManHourTrendChart data={trend} />
      </div>
    </div>
  );
}
