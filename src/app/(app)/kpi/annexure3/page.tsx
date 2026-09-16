import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProject } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { Field, FormError, inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { formatPercent, formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { getAnnexure3Kpi, getRosterManHours } from "@/lib/kpi/annexure3";
import { resolvePeriod } from "@/lib/kpi/period";
import { SimplePieChart } from "@/components/dashboard/dashboard-charts";
import { saveRosterSettings, saveReportBaseline, saveDailyManHours, saveKpiInputs } from "./actions";

// Annexure3Kpi's Pct fields are 0-1 fractions (matching the ported formulas
// and the pie-chart math below); formatPercent expects the 0-100 scale used
// everywhere else in this app.
function pct(value: number | null): string {
  return formatPercent(value === null ? null : value * 100);
}

function reportNumberFor(date: Date, baseline: number | null, baseDate: Date | null): number | null {
  if (baseline === null || !baseDate) return null;
  const days = Math.round((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  return baseline + days;
}

export default async function Annexure3KpiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string }>;
}) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "read");
  const project = await getCurrentProject();
  const { date: dateParam, error } = await searchParams;
  const canWrite = can(session.user.role, "KPI_MANAGEMENT", "write");

  if (!project) {
    return (
      <div>
        <PageHeader title="Annexure-3 KPI" />
        <p className="rounded-xl border border-dashed border-line-strong bg-surface py-10 text-center text-sm text-ink-faint">
          No project configured yet.
        </p>
      </div>
    );
  }

  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const [kpi, existingEntry, monthRoster] = await Promise.all([
    getAnnexure3Kpi(project.id, date),
    prisma.kpiDailyEntry.findUnique({ where: { projectId_date: { projectId: project.id, date } } }),
    getRosterManHours(project.id, resolvePeriod("MONTHLY", date)),
  ]);

  const reportNo = reportNumberFor(date, project.reportNoBaseline, project.reportNoBaseDate);

  const breakdownRows: { category: string; name: string; weight: number; score: number | null }[] = [
    { category: "Schedule (55%)", name: "Frozen Schedule Compliance", weight: 0.25, score: kpi.scheduleParts.frozen },
    { category: "Schedule (55%)", name: "PM Backlog", weight: 0.25, score: kpi.scheduleParts.pmBacklog },
    { category: "Schedule (55%)", name: "CM Backlog", weight: 0.25, score: kpi.scheduleParts.cmBacklog },
    { category: "Schedule (55%)", name: "SCE's PM Compliance", weight: 0.25, score: kpi.scheduleParts.sce },
    { category: "Quality (20%)", name: "Zero Leakage", weight: 0.5, score: kpi.qualityParts.zeroLeakage },
    { category: "Quality (20%)", name: "Re-work", weight: 0.5, score: kpi.qualityParts.rework },
    ...kpi.hseItems.map((i) => ({
      category: "HSSE (25%)",
      name: i.description,
      weight: i.weight,
      score: i.weight > 0 ? i.achieved / i.weight : null,
    })),
  ];

  const mhPieData = [
    { name: "Actual", value: Math.round(monthRoster.actualMH) },
    { name: "Remaining", value: Math.max(0, Math.round(monthRoster.availableMH - monthRoster.actualMH)) },
  ];

  return (
    <div>
      <PageHeader
        title="Annexure-3 KPI"
        description={`Contract weighted KPI score - Schedule Compliance (55%) + Quality (20%) + HSSE (25%). Viewing ${formatDate(date)}${reportNo !== null ? ` - Report #${reportNo}` : ""}.`}
        actions={
          <form className="flex items-end gap-2">
            <Field label="Viewing date" htmlFor="date">
              <input type="date" id="date" name="date" defaultValue={date.toISOString().slice(0, 10)} className={inputClass} />
            </Field>
            <button type="submit" className={buttonPrimaryClass}>
              Go
            </button>
          </form>
        }
      />

      {error && <FormError message={error} />}

      <div className="mb-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Overall KPI Score</p>
        <p className="mt-2 text-4xl font-semibold text-indigo-600 dark:text-indigo-400">{pct(kpi.overallPct)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {kpi.overallCategoriesUsed < 3
            ? `Based on ${kpi.overallCategoriesUsed} of 3 categories - missing data is excluded, not treated as zero.`
            : "Schedule 55% + Quality 20% + HSSE 25%."}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Schedule Compliance (55%)</h3>
          <p className="mb-2 text-2xl font-semibold text-ink-strong">{pct(kpi.schedulePct)}</p>
          <SimplePieChart
            data={[
              { name: "Achieved", value: kpi.schedulePct !== null ? Math.round(kpi.schedulePct * 100) : 0 },
              { name: "Gap", value: kpi.schedulePct !== null ? Math.round(100 - kpi.schedulePct * 100) : 0 },
            ]}
          />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Quality (20%)</h3>
          <p className="mb-2 text-2xl font-semibold text-ink-strong">{pct(kpi.qcPct)}</p>
          <SimplePieChart
            data={[
              { name: "Achieved", value: kpi.qcPct !== null ? Math.round(kpi.qcPct * 100) : 0 },
              { name: "Gap", value: kpi.qcPct !== null ? Math.round(100 - kpi.qcPct * 100) : 0 },
            ]}
          />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">HSSE (25%)</h3>
          <p className="mb-2 text-2xl font-semibold text-ink-strong">{pct(kpi.hsePct)}</p>
          <SimplePieChart
            data={[
              { name: "Achieved", value: kpi.hsePct !== null ? Math.round(kpi.hsePct * 100) : 0 },
              { name: "Gap", value: kpi.hsePct !== null ? Math.round(100 - kpi.hsePct * 100) : 0 },
            ]}
          />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-ink">Sub-Metric Breakdown</h2>
        <Table>
          <THead>
            <tr>
              <Th>Category</Th>
              <Th>Sub-metric</Th>
              <Th>Weight</Th>
              <Th>Score</Th>
            </tr>
          </THead>
          <TBody>
            {breakdownRows.length === 0 && <EmptyRow colSpan={4} />}
            {breakdownRows.map((r) => (
              <tr key={`${r.category}-${r.name}`}>
                <Td>{r.category}</Td>
                <Td>{r.name}</Td>
                <Td>{(r.weight * 100).toFixed(0)}%</Td>
                <Td>{r.score === null ? "n/a" : `${(r.score * 100).toFixed(1)}% of ${(r.weight * 100).toFixed(0)}%`}</Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-ink">Man-Hours Utilization (Plan vs Actual, this month)</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4">
            <SimplePieChart data={mhPieData} />
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
            <p>
              Available: <strong className="text-ink-strong">{Math.round(monthRoster.availableMH)}</strong> MH
            </p>
            <p>
              Actual: <strong className="text-ink-strong">{Math.round(monthRoster.actualMH)}</strong> MH ({monthRoster.workingDays}{" "}
              standard working days x roster + emergency/callout)
            </p>
          </div>
        </div>
      </section>

      {canWrite && (
        <>
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-ink">Man-Power Roster (automatic daily man-hours)</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Standard working days are Sunday-Thursday. Daily man-hours for those days are calculated automatically
              from the headcounts and hours below - update these only when your roster or standard hours change.
            </p>
            <form action={saveRosterSettings} className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-4">
              <Field label="Direct manpower (qty)" htmlFor="rosterDirectQty">
                <input type="number" id="rosterDirectQty" name="rosterDirectQty" defaultValue={project.rosterDirectQty ?? 6} className={inputClass} />
              </Field>
              <Field label="In-direct manpower (qty)" htmlFor="rosterIndirectQty">
                <input
                  type="number"
                  id="rosterIndirectQty"
                  name="rosterIndirectQty"
                  defaultValue={project.rosterIndirectQty ?? 4}
                  className={inputClass}
                />
              </Field>
              <Field label="Standard hours/day" htmlFor="rosterStandardHours">
                <input
                  type="number"
                  step="0.5"
                  id="rosterStandardHours"
                  name="rosterStandardHours"
                  defaultValue={project.rosterStandardHours?.toString() ?? "8"}
                  className={inputClass}
                />
              </Field>
              <Field label="Available man-hours/week" htmlFor="availableMhrsPerWeek">
                <input
                  type="number"
                  id="availableMhrsPerWeek"
                  name="availableMhrsPerWeek"
                  defaultValue={project.availableMhrsPerWeek?.toString() ?? 240}
                  className={inputClass}
                />
              </Field>
              <div>
                <button type="submit" className={buttonPrimaryClass}>
                  Save roster settings
                </button>
              </div>
            </form>
          </section>

          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-ink">Report Numbering Baseline</h2>
            <p className="mb-3 text-xs text-ink-muted">Every other date&apos;s report # is auto-computed from this baseline (1 report per calendar day).</p>
            <form action={saveReportBaseline} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
              <Field label="Report # baseline" htmlFor="reportNoBaseline">
                <input type="number" id="reportNoBaseline" name="reportNoBaseline" defaultValue={project.reportNoBaseline ?? ""} className={inputClass} />
              </Field>
              <Field label="...for date" htmlFor="reportNoBaseDate">
                <input
                  type="date"
                  id="reportNoBaseDate"
                  name="reportNoBaseDate"
                  defaultValue={project.reportNoBaseDate ? project.reportNoBaseDate.toISOString().slice(0, 10) : ""}
                  className={inputClass}
                />
              </Field>
              <button type="submit" className={buttonPrimaryClass}>
                Save baseline
              </button>
            </form>
          </section>

          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-ink">Man-Hours &amp; LTI - Daily Entry ({formatDate(date)})</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Only fill in Emergency/Callout MH when manpower worked overtime on a weekend or during an emergency callout -
              leave at 0 otherwise. The LTI checkbox must be set correctly every day.
            </p>
            <form action={saveDailyManHours} className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-4">
              <input type="hidden" name="date" value={date.toISOString().slice(0, 10)} />
              <Field label="Direct emergency/callout MH" htmlFor="directEmergencyMH">
                <input
                  type="number"
                  step="0.5"
                  id="directEmergencyMH"
                  name="directEmergencyMH"
                  defaultValue={existingEntry?.directEmergencyMH?.toString() ?? 0}
                  className={inputClass}
                />
              </Field>
              <Field label="In-direct emergency/callout MH" htmlFor="indirectEmergencyMH">
                <input
                  type="number"
                  step="0.5"
                  id="indirectEmergencyMH"
                  name="indirectEmergencyMH"
                  defaultValue={existingEntry?.indirectEmergencyMH?.toString() ?? 0}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="ltiOccurred" defaultChecked={existingEntry?.ltiOccurred ?? false} />
                  LTI occurred on this day
                </label>
              </div>
              <div className="flex items-end">
                <button type="submit" className={buttonPrimaryClass}>
                  Save day
                </button>
              </div>
            </form>
          </section>

          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-ink">KPI Inputs - Quality / HSSE ({formatDate(date)})</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Schedule Compliance is calculated live from your Work Orders and needs nothing saved here. Quality and HSSE
              apply from the date you save them onward.
            </p>
            <form action={saveKpiInputs} className="rounded-xl border border-line bg-surface p-4">
              <input type="hidden" name="date" value={date.toISOString().slice(0, 10)} />
              <div className="mb-4 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="zeroLeakage" defaultChecked={existingEntry?.zeroLeakage ?? true} />
                  Zero Leakage achieved
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="noRework" defaultChecked={existingEntry?.noRework ?? true} />
                  No re-work
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="TRIF value" htmlFor="trif">
                  <input type="number" step="0.01" id="trif" name="trif" defaultValue={existingEntry?.trif?.toString() ?? 0} className={inputClass} />
                </Field>
                <Field label="PTW compliance %" htmlFor="ptwPct">
                  <input type="number" id="ptwPct" name="ptwPct" defaultValue={existingEntry?.ptwPct?.toString() ?? 100} className={inputClass} />
                </Field>
                <Field label="LSR #4,8,12 violations" htmlFor="lsrViolations">
                  <input
                    type="number"
                    id="lsrViolations"
                    name="lsrViolations"
                    defaultValue={existingEntry?.lsrViolations ?? 0}
                    className={inputClass}
                  />
                </Field>
                <Field label="Other LSR compliance %" htmlFor="otherLsrPct">
                  <input
                    type="number"
                    id="otherLsrPct"
                    name="otherLsrPct"
                    defaultValue={existingEntry?.otherLsrPct?.toString() ?? 100}
                    className={inputClass}
                  />
                </Field>
                <Field label="LSR closeout %" htmlFor="lsrCloseoutPct">
                  <input
                    type="number"
                    id="lsrCloseoutPct"
                    name="lsrCloseoutPct"
                    defaultValue={existingEntry?.lsrCloseoutPct?.toString() ?? 100}
                    className={inputClass}
                  />
                </Field>
                <Field label="Safety observations %" htmlFor="safetyObsPct">
                  <input
                    type="number"
                    id="safetyObsPct"
                    name="safetyObsPct"
                    defaultValue={existingEntry?.safetyObsPct?.toString() ?? 100}
                    className={inputClass}
                  />
                </Field>
                <Field label="Leadership walk %" htmlFor="leadershipWalkPct">
                  <input
                    type="number"
                    id="leadershipWalkPct"
                    name="leadershipWalkPct"
                    defaultValue={existingEntry?.leadershipWalkPct?.toString() ?? 100}
                    className={inputClass}
                  />
                </Field>
                <Field label="Vehicle incidents" htmlFor="vehicleIncidents">
                  <input
                    type="number"
                    id="vehicleIncidents"
                    name="vehicleIncidents"
                    defaultValue={existingEntry?.vehicleIncidents ?? 0}
                    className={inputClass}
                  />
                </Field>
                <Field label="Security violations" htmlFor="securityViolations">
                  <input
                    type="number"
                    id="securityViolations"
                    name="securityViolations"
                    defaultValue={existingEntry?.securityViolations ?? 0}
                    className={inputClass}
                  />
                </Field>
                <Field label="Oil/Chemical spills" htmlFor="spills">
                  <input type="number" id="spills" name="spills" defaultValue={existingEntry?.spills ?? 0} className={inputClass} />
                </Field>
              </div>
              <div className="mt-4">
                <button type="submit" className={buttonPrimaryClass}>
                  Save KPI inputs
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
