import Link from "next/link";
import clsx from "clsx";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProject } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPercent, formatHours, formatNumber } from "@/lib/format";
import { inputClass, buttonPrimaryClass } from "@/components/ui/form";
import {
  getMaintenanceKpis,
  getSceKpis,
  getActionKpis,
  getHseKpis,
  getQcKpis,
  getManHourKpis,
  getLtiFreeManHours,
} from "@/lib/kpi/engine";
import { resolvePeriod, PERIOD_LABELS, type PeriodType } from "@/lib/kpi/period";
import { getMaintenanceTrend, getManHourTrend } from "@/lib/kpi/trends";
import { MaintenanceTrendChart, PmCmTrendChart, ManHourTrendChart } from "@/components/dashboard/dashboard-charts";

const PERIOD_TYPES: PeriodType[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  await requireModuleAccess("DASHBOARD", "read");
  const project = await getCurrentProject();
  const { period: periodParam, start, end } = await searchParams;
  const period: PeriodType = PERIOD_TYPES.includes(periodParam as PeriodType) ? (periodParam as PeriodType) : "MONTHLY";

  if (!project) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
          No project configured yet. Go to Administration → Projects to create one.
        </p>
      </div>
    );
  }

  const range = resolvePeriod(period, new Date(), { start, end });

  const [maintenance, sce, actions, hse, qc, manHours, ltiFree, trend, hourTrend, recentActivity, criticalFindings, overdueActions] =
    await Promise.all([
      getMaintenanceKpis(project.id, range),
      getSceKpis(project.id),
      getActionKpis(project.id),
      getHseKpis(project.id, range),
      getQcKpis(project.id, range),
      getManHourKpis(project.id, range),
      getLtiFreeManHours(project.id),
      getMaintenanceTrend(project.id, 6),
      getManHourTrend(project.id, 6),
      prisma.workOrder.findMany({
        where: { projectId: project.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { equipment: { select: { tagNumber: true } } },
      }),
      prisma.finding.findMany({
        where: { projectId: project.id, severity: { in: ["HIGH", "CRITICAL"] }, status: { not: "CLOSED" } },
        orderBy: { date: "desc" },
        take: 8,
        include: { equipment: { select: { tagNumber: true } } },
      }),
      prisma.action.findMany({
        where: {
          projectId: project.id,
          status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED", "PENDING_VERIFICATION"] },
          targetDate: { lt: new Date() },
        },
        orderBy: { targetDate: "asc" },
        take: 8,
        include: { equipment: { select: { tagNumber: true } } },
      }),
    ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${project.name} — ${PERIOD_LABELS[period]}${period === "CUSTOM" && start && end ? ` (${start} to ${end})` : ""}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <nav className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {PERIOD_TYPES.map((p) => (
            <Link
              key={p}
              href={`?period=${p}`}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                period === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </nav>
        {period === "CUSTOM" && (
          <form className="flex items-center gap-2">
            <input type="hidden" name="period" value="CUSTOM" />
            <input type="date" name="start" defaultValue={start} className={inputClass} />
            <span className="text-sm text-slate-400">to</span>
            <input type="date" name="end" defaultValue={end} className={inputClass} />
            <button type="submit" className={buttonPrimaryClass}>
              Apply
            </button>
          </form>
        )}
      </div>

      {/* KPI Row 1 - Maintenance */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Maintenance</h2>
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="PM Compliance"
          value={formatPercent(maintenance.pmCompliancePct)}
          sublabel={`${maintenance.pmCompleted} / ${maintenance.pmPlanned} planned`}
          tone={maintenance.pmCompliancePct !== null && maintenance.pmCompliancePct < 80 ? "critical" : "good"}
          href="/pm"
        />
        <StatCard
          label="CM Completion"
          value={formatPercent(maintenance.cmCompletionPct)}
          sublabel={`${maintenance.cmCompleted} / ${maintenance.cmReported} reported`}
          href="/cm"
        />
        <StatCard
          label="Overall Maintenance"
          value={formatPercent(maintenance.overallCompletionPct)}
          sublabel={`${maintenance.totalCompleted} / ${maintenance.totalPlanned} jobs`}
          href="/maintenance"
        />
        <StatCard
          label="SCE Compliance"
          value={formatPercent(sce.compliancePct)}
          sublabel={`${sce.overdue} overdue of ${sce.total}`}
          tone={sce.overdue > 0 ? "critical" : "good"}
          href="/sce"
        />
      </div>

      {/* KPI Row 2 - HSE / QC */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">HSE &amp; QC</h2>
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="LTI" value={String(hse.ltiCount)} tone={hse.ltiCount > 0 ? "critical" : "good"} href="/hse" />
        <StatCard label="TRIF" value={String(hse.trifCount)} tone={hse.trifCount > 0 ? "warning" : "good"} href="/hse" />
        <StatCard
          label="HSE Observations"
          value={String(hse.observations)}
          sublabel={`${hse.openObservations} open`}
          href="/hse"
        />
        <StatCard
          label="QC NCR Closure"
          value={formatPercent(qc.ncrClosurePct)}
          sublabel={`${qc.ncrsOpen} open NCRs`}
          href="/qc"
        />
      </div>

      {/* KPI Row 3 - Man-hours & Actions */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Man-Hours &amp; Actions</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="LTI-Free Man-Hours"
          value={formatNumber(ltiFree.manHoursSinceLastLti)}
          sublabel={ltiFree.daysLtiFree !== null ? `${ltiFree.daysLtiFree} days LTI-free` : "N/A"}
          tone="good"
        />
        <StatCard
          label="Project Man-Hours"
          value={formatHours(manHours.totalHours)}
          sublabel={`${manHours.employeeCount} employees`}
          href="/man-hours"
        />
        <StatCard
          label="Open Actions"
          value={String(actions.open)}
          sublabel={`${actions.overdue} overdue`}
          tone={actions.overdue > 0 ? "critical" : "good"}
          href="/actions"
        />
        <StatCard
          label="Overdue Jobs"
          value={String(maintenance.overdueJobs)}
          tone={maintenance.overdueJobs > 0 ? "critical" : "good"}
          href="/daily-planning?view=overdue"
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Planned vs Completed (6-Month Trend)</h3>
          <MaintenanceTrendChart data={trend} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">PM / CM Completion Trend</h3>
          <PmCmTrendChart data={trend} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Man-Hour Trend</h3>
          <ManHourTrendChart data={hourTrend} />
        </div>
      </div>

      {/* Bottom lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Recent Maintenance Activities</h3>
          <Table>
            <THead>
              <tr>
                <Th>WO #</Th>
                <Th>Equipment</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {recentActivity.length === 0 && <EmptyRow colSpan={3} />}
              {recentActivity.map((w) => (
                <tr key={w.id}>
                  <Td>
                    <Link href={`/work-orders/${w.id}`} className="text-blue-700 hover:underline">
                      {w.workOrderNumber}
                    </Link>
                  </Td>
                  <Td>{w.equipment?.tagNumber ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={w.status} />
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Critical Findings</h3>
          <Table>
            <THead>
              <tr>
                <Th>Equipment</Th>
                <Th>Description</Th>
                <Th>Severity</Th>
              </tr>
            </THead>
            <TBody>
              {criticalFindings.length === 0 && <EmptyRow colSpan={3} />}
              {criticalFindings.map((f) => (
                <tr key={f.id}>
                  <Td>{f.equipment?.tagNumber ?? "—"}</Td>
                  <Td className="max-w-[160px] truncate">
                    <Link href={`/findings/${f.id}`} className="text-blue-700 hover:underline">
                      {f.description}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={f.severity} />
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Overdue Actions</h3>
          <Table>
            <THead>
              <tr>
                <Th>Description</Th>
                <Th>Target</Th>
              </tr>
            </THead>
            <TBody>
              {overdueActions.length === 0 && <EmptyRow colSpan={2} />}
              {overdueActions.map((a) => (
                <tr key={a.id}>
                  <Td className="max-w-[180px] truncate">
                    <Link href={`/actions/${a.id}`} className="text-blue-700 hover:underline">
                      {a.description}
                    </Link>
                  </Td>
                  <Td>{formatDate(a.targetDate)}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
