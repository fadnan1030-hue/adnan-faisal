import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { saveTimesheetForDate } from "./actions";

const STATUSES = ["PRESENT", "ABSENT", "LEAVE", "SICK", "OFF", "TRAINING", "HOLIDAY", "OTHER"];

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; saved?: string }>;
}) {
  const session = await requireModuleAccess("TIMESHEET", "read");
  const projectId = await getCurrentProjectId();
  const { date: dateParam, saved } = await searchParams;
  const date = dateParam || new Date().toISOString().slice(0, 10);
  const canWrite = can(session.user.role, "TIMESHEET", "write");

  const [employees, existing] = projectId
    ? await Promise.all([
        prisma.employee.findMany({
          where: { projectId, active: true },
          include: { contractor: true },
          orderBy: { name: "asc" },
        }),
        prisma.timesheet.findMany({ where: { projectId, date: new Date(date) } }),
      ])
    : [[], []];

  const existingByEmployee = new Map(existing.map((t) => [t.employeeId, t]));

  return (
    <div>
      <PageHeader
        title="Timesheet"
        description="Daily attendance replaces the wide Excel timesheet format with normalized records (spec section 31)."
      />

      <form className="mb-4 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
          <input type="date" name="date" defaultValue={date} className={inputClass} />
        </div>
        <button type="submit" className={buttonPrimaryClass}>
          Go
        </button>
        {saved && <span className="ml-2 text-sm text-emerald-600">Saved.</span>}
      </form>

      {!projectId ? (
        <EmptyState message="Select a project to view timesheets." />
      ) : employees.length === 0 ? (
        <EmptyState message="No employees found. Add employees under Administration." />
      ) : (
        <form action={saveTimesheetForDate}>
          <input type="hidden" name="date" value={date} />
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Craft / Contractor</Th>
                <Th>Status</Th>
                <Th>Normal Hrs</Th>
                <Th>Overtime Hrs</Th>
                <Th>Remarks</Th>
              </tr>
            </THead>
            <TBody>
              {employees.map((e) => {
                const entry = existingByEmployee.get(e.id);
                return (
                  <tr key={e.id}>
                    <Td className="font-medium text-slate-900">
                      <input type="hidden" name="employeeId" value={e.id} />
                      {e.name} <span className="text-slate-400">({e.employeeNumber})</span>
                    </Td>
                    <Td>
                      {e.craft ?? "—"} {e.contractor ? `· ${e.contractor.name}` : ""}
                    </Td>
                    <Td>
                      <select
                        name={`status_${e.id}`}
                        defaultValue={entry?.status ?? "PRESENT"}
                        disabled={!canWrite}
                        className={inputClass}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        name={`normal_${e.id}`}
                        defaultValue={entry?.normalHours.toString() ?? "8"}
                        disabled={!canWrite}
                        className={`${inputClass} w-20`}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        name={`overtime_${e.id}`}
                        defaultValue={entry?.overtimeHours.toString() ?? "0"}
                        disabled={!canWrite}
                        className={`${inputClass} w-20`}
                      />
                    </Td>
                    <Td>
                      <input
                        type="text"
                        name={`remarks_${e.id}`}
                        defaultValue={entry?.remarks ?? ""}
                        disabled={!canWrite}
                        className={inputClass}
                      />
                    </Td>
                  </tr>
                );
              })}
            </TBody>
          </Table>
          {canWrite && (
            <button type="submit" className={`${buttonPrimaryClass} mt-4`}>
              Save Timesheet
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
