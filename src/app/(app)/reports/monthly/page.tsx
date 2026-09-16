import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProject } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPercent, formatHours } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
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

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireModuleAccess("REPORTS", "read");
  const project = await getCurrentProject();
  const { period: periodParam } = await searchParams;
  const period: PeriodType = periodParam === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  if (!project) {
    return <p className="text-sm text-slate-400">No project selected.</p>;
  }

  const range = resolvePeriod(period);

  const [maintenance, sce, actions, hse, qc, manHours, ltiFree, criticalFindings, openActions] = await Promise.all([
    getMaintenanceKpis(project.id, range),
    getSceKpis(project.id),
    getActionKpis(project.id),
    getHseKpis(project.id, range),
    getQcKpis(project.id, range),
    getManHourKpis(project.id, range),
    getLtiFreeManHours(project.id),
    prisma.finding.findMany({
      where: { projectId: project.id, severity: { in: ["HIGH", "CRITICAL"] }, date: { gte: range.start, lte: range.end } },
      include: { equipment: { select: { tagNumber: true } } },
      take: 20,
    }),
    prisma.action.findMany({
      where: { projectId: project.id, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } },
      include: { equipment: { select: { tagNumber: true } } },
      take: 20,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 print:p-0">
      <div className="no-print mb-4">
        <PrintButton />
      </div>

      {/* Cover */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400">Management Report</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reporting Period: {PERIOD_LABELS[period]} ({formatDate(range.start)} – {formatDate(range.end)})
        </p>
        <p className="mt-1 text-xs text-slate-400">Generated {formatDate(new Date())} — Maintenance &amp; KPI Management System</p>
      </div>

      {/* Executive Summary */}
      <ReportSection title="Executive KPI Summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStat label="PM Compliance" value={formatPercent(maintenance.pmCompliancePct)} />
          <ReportStat label="CM Completion" value={formatPercent(maintenance.cmCompletionPct)} />
          <ReportStat label="Overall Maintenance" value={formatPercent(maintenance.overallCompletionPct)} />
          <ReportStat label="SCE Compliance" value={formatPercent(sce.compliancePct)} />
          <ReportStat label="LTI (period)" value={String(hse.ltiCount)} />
          <ReportStat label="TRIF (period)" value={String(hse.trifCount)} />
          <ReportStat label="QC NCR Closure" value={formatPercent(qc.ncrClosurePct)} />
          <ReportStat label="LTI-Free Man-Hours" value={ltiFree.manHoursSinceLastLti.toLocaleString()} />
        </div>
      </ReportSection>

      <ReportSection title="Maintenance Performance">
        <ReportTable
          rows={[
            ["PM Planned / Completed", `${maintenance.pmPlanned} / ${maintenance.pmCompleted}`],
            ["CM Reported / Completed", `${maintenance.cmReported} / ${maintenance.cmCompleted}`],
            ["Open Jobs", String(maintenance.openJobs)],
            ["Overdue Jobs", String(maintenance.overdueJobs)],
            ["Planned vs Actual Hours", `${formatHours(maintenance.plannedHours)} / ${formatHours(maintenance.actualHours)}`],
          ]}
        />
      </ReportSection>

      <ReportSection title="HSE">
        <ReportTable
          rows={[
            ["LTI", String(hse.ltiCount)],
            ["TRIF", String(hse.trifCount)],
            ["Safety Observations", String(hse.observations)],
            ["Open HSE Actions", String(hse.openHseActions)],
            ["Days LTI-Free", ltiFree.daysLtiFree === null ? "N/A" : String(ltiFree.daysLtiFree)],
          ]}
        />
      </ReportSection>

      <ReportSection title="SCE">
        <ReportTable
          rows={[
            ["Total SCE", String(sce.total)],
            ["Due", String(sce.due)],
            ["Completed", String(sce.completed)],
            ["Overdue", String(sce.overdue)],
            ["Compliance", formatPercent(sce.compliancePct)],
          ]}
        />
      </ReportSection>

      <ReportSection title="QC">
        <ReportTable
          rows={[
            ["Inspections", String(qc.inspections)],
            ["Open NCRs", String(qc.ncrsOpen)],
            ["Closed NCRs", String(qc.ncrsClosed)],
            ["NCR Closure %", formatPercent(qc.ncrClosurePct)],
          ]}
        />
      </ReportSection>

      <ReportSection title="Man-Hours">
        <ReportTable
          rows={[
            ["Normal Hours", formatHours(manHours.normalHours)],
            ["Overtime Hours", formatHours(manHours.overtimeHours)],
            ["Total Hours", formatHours(manHours.totalHours)],
            ["Employees Recorded", String(manHours.employeeCount)],
          ]}
        />
      </ReportSection>

      <ReportSection title="Equipment Findings (High / Critical)">
        {criticalFindings.length === 0 ? (
          <p className="text-sm text-slate-400">No high/critical findings this period.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {criticalFindings.map((f) => (
              <li key={f.id}>
                <strong>{f.equipment?.tagNumber ?? "—"}</strong> — {f.description} ({f.severity})
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection title="Action Tracker">
        <ReportTable
          rows={[
            ["Total Actions", String(actions.total)],
            ["Open", String(actions.open)],
            ["Overdue", String(actions.overdue)],
            ["Closed", String(actions.closed)],
            ["Closure %", formatPercent(actions.closurePct)],
          ]}
        />
        {openActions.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {openActions.map((a) => (
              <li key={a.id}>
                {a.description} {a.equipment ? `(${a.equipment.tagNumber})` : ""} — {a.status}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <p className="mt-8 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
        Page generated automatically from live project data. No values on this report are manually entered.
      </p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ReportTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between py-1.5">
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
