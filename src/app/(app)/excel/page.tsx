import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { inputClass, buttonPrimaryClass, Field } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { importWorkOrders, importBulkPaste } from "./actions";

const EXPORT_OPTIONS: { dataset: string; label: string; description: string }[] = [
  { dataset: "all", label: "Complete Dataset", description: "Every module in one workbook, one worksheet each." },
  { dataset: "equipment", label: "Equipment", description: "Equipment master list." },
  { dataset: "workorders", label: "Work Orders", description: "Full work order database." },
  { dataset: "pm", label: "PM", description: "Preventive maintenance records." },
  { dataset: "cm", label: "CM", description: "Corrective maintenance records." },
  { dataset: "findings", label: "Findings", description: "All findings with severity/status." },
  { dataset: "actions", label: "Actions", description: "Action tracker register." },
  { dataset: "sce", label: "SCE", description: "Safety critical equipment register." },
  { dataset: "hse", label: "HSE", description: "Incidents and observations." },
  { dataset: "qc", label: "QC", description: "Inspections and NCRs." },
  { dataset: "timesheet", label: "Timesheet", description: "Daily attendance / man-hours." },
];

export default async function ExcelPage({ searchParams }: { searchParams: Promise<{ jobId?: string; error?: string }> }) {
  const session = await requireModuleAccess("EXCEL_IO", "read");
  const projectId = await getCurrentProjectId();
  const { jobId, error } = await searchParams;
  const canImport = can(session.user.role, "EXCEL_IO", "write");

  const [lastJob, recentJobs] = projectId
    ? await Promise.all([
        jobId ? prisma.importJob.findUnique({ where: { id: jobId }, include: { errors: { take: 20 } } }) : null,
        prisma.importJob.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 }),
      ])
    : [null, []];

  return (
    <div>
      <PageHeader
        title="Excel Import / Export"
        description="Spec sections 40-42 — clean worksheet exports and a mapped Work Order import wizard example."
      />

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-ink">Export to Excel</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_OPTIONS.map((o) => (
            <a
              key={o.dataset}
              href={`/api/export/excel?dataset=${o.dataset}`}
              className="rounded-xl border border-line bg-surface p-4 shadow-sm hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-ink-strong">{o.label}</h3>
              <p className="mt-1 text-xs text-ink-muted">{o.description}</p>
            </a>
          ))}
        </div>
      </section>

      {canImport && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-ink">Import Work Orders</h2>
          <p className="mb-3 text-xs text-ink-muted">
            Upload an .xlsx workbook. The first worksheet is read and mapped using the column names from the
            reference workbook: WO#, Work Center, Operation Short Text, Scope, Sort Field, Location, Plan start
            date, Plan Finish Date, Earliest Finish Date, Actual Start Date, Actual Finish Date, Plan Hrs, Actual
            Hrs, Remarks.
          </p>
          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}
          <form action={importWorkOrders} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="min-w-[220px]">
              <Field label="Workbook (.xlsx)" htmlFor="file">
                <input type="file" id="file" name="file" accept=".xlsx" required className={inputClass} />
              </Field>
            </div>
            <div>
              <Field label="If WO# already exists" htmlFor="duplicateStrategy">
                <select id="duplicateStrategy" name="duplicateStrategy" defaultValue="SKIP" className={inputClass}>
                  <option value="SKIP">Skip duplicate</option>
                  <option value="UPDATE">Update existing</option>
                </select>
              </Field>
            </div>
            <button type="submit" className={buttonPrimaryClass}>
              Import
            </button>
          </form>
        </section>
      )}

      {canImport && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-ink">Bulk Paste from Excel</h2>
          <p className="mb-3 text-xs text-ink-muted">
            Copy rows from Excel (or type them) in this exact column order, one activity per line, separated by Tab.
            An existing Work Order # is updated in place; a new one is created. Report Date, Reference # and Week
            have no equivalent field here, so they&apos;re read but not stored.
          </p>
          <p className="mb-3 rounded-md border border-line bg-surface-muted px-3 py-2 font-mono text-[11px] text-ink-soft">
            Report Date | Scope | Discipline (PM/CM/General/Emergency Callout) | Activity | Location | Sort Field |
            Work Order # | Reference # | Plan Start | Plan Finish | Actual Start | Actual Finish | Planned Hours |
            Actual Hours | Status | Week | Remarks | ABC Indicator (A/B/C/D, optional) | Priority (optional)
          </p>
          <form action={importBulkPaste} className="rounded-xl border border-line bg-surface p-4">
            <textarea
              name="bulkPaste"
              rows={8}
              required
              placeholder="Paste tab-separated rows here..."
              className={`${inputClass} font-mono text-xs`}
            />
            <button type="submit" className={`${buttonPrimaryClass} mt-3`}>
              Import Pasted Rows
            </button>
          </form>
        </section>
      )}

      {lastJob && (
        <section className="mb-8 rounded-xl border border-line bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Import Summary — {lastJob.sourceFileName}</h2>
          <p className="text-sm text-ink-soft">
            {lastJob.importedRows} imported, {lastJob.failedRows} failed, of {lastJob.totalRows} total rows.
          </p>
          {lastJob.errors.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase text-ink-faint">Rejected Rows</h3>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-red-600 dark:text-red-400">
                {lastJob.errors.map((e) => (
                  <li key={e.id}>
                    Row {e.rowNumber}: {e.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Recent Import Jobs</h2>
        <Table>
          <THead>
            <tr>
              <Th>File</Th>
              <Th>Entity</Th>
              <Th>Imported / Failed / Total</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <TBody>
            {recentJobs.length === 0 && <EmptyRow colSpan={5} />}
            {recentJobs.map((j) => (
              <tr key={j.id}>
                <Td>{j.sourceFileName}</Td>
                <Td>{j.targetEntity}</Td>
                <Td>
                  {j.importedRows} / {j.failedRows} / {j.totalRows}
                </Td>
                <Td>
                  <StatusBadge status={j.status} />
                </Td>
                <Td>{formatDateTime(j.createdAt)}</Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
