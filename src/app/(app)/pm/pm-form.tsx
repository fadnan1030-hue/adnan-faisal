import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import { toInputDate } from "@/lib/format";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import type { PmRecord } from "@prisma/client";

const STATUSES = ["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "PARTIALLY_COMPLETED", "RESCHEDULED", "CANCELLED", "OVERDUE"];

export async function PmForm({
  projectId,
  record,
  action,
  error,
}: {
  projectId: string;
  record?: PmRecord & { equipment?: { tagNumber: string } | null };
  action: (formData: FormData) => void;
  error?: string;
}) {
  const [frequencies, disciplines, workCenters] = await Promise.all([
    getConfigOptions(projectId, "PM_FREQUENCY"),
    getConfigOptions(projectId, "DISCIPLINE"),
    getConfigOptions(projectId, "WORK_CENTER"),
  ]);

  return (
    <form action={action} className="max-w-4xl space-y-6">
      {record && <input type="hidden" name="id" value={record.id} />}
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <EquipmentTagField projectId={projectId} defaultValue={record?.equipment?.tagNumber} required={!record} />

        <Field label="PM Type" htmlFor="pmType">
          <input id="pmType" name="pmType" defaultValue={record?.pmType ?? ""} className={inputClass} />
        </Field>
        <Field label="PM Frequency" htmlFor="pmFrequency">
          <input list="pm-frequencies" id="pmFrequency" name="pmFrequency" defaultValue={record?.pmFrequency ?? ""} className={inputClass} />
          <datalist id="pm-frequencies">
            {frequencies.map((f) => (
              <option key={f.id} value={f.label} />
            ))}
          </datalist>
        </Field>

        <Field label="Planned Date" htmlFor="plannedDate" required>
          <input
            type="date"
            id="plannedDate"
            name="plannedDate"
            defaultValue={toInputDate(record?.plannedDate)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Planned Start" htmlFor="plannedStart">
          <input type="datetime-local" id="plannedStart" name="plannedStart" defaultValue={record?.plannedStart?.toISOString().slice(0, 16) ?? ""} className={inputClass} />
        </Field>
        <Field label="Planned Finish" htmlFor="plannedFinish">
          <input type="datetime-local" id="plannedFinish" name="plannedFinish" defaultValue={record?.plannedFinish?.toISOString().slice(0, 16) ?? ""} className={inputClass} />
        </Field>

        <Field label="Responsible Discipline" htmlFor="responsibleDiscipline">
          <input list="disciplines" id="responsibleDiscipline" name="responsibleDiscipline" defaultValue={record?.responsibleDiscipline ?? ""} className={inputClass} />
          <datalist id="disciplines">
            {disciplines.map((d) => (
              <option key={d.id} value={d.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Work Center" htmlFor="workCenter">
          <input list="work-centers" id="workCenter" name="workCenter" defaultValue={record?.workCenter ?? ""} className={inputClass} />
          <datalist id="work-centers">
            {workCenters.map((w) => (
              <option key={w.id} value={w.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={record?.location ?? ""} className={inputClass} />
        </Field>

        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={record?.priority ?? "MEDIUM"} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </Field>
        <Field label="Criticality" htmlFor="criticality">
          <select id="criticality" name="criticality" defaultValue={record?.criticality ?? "MEDIUM"} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>

        {record && (
          <>
            <Field label="Actual Start" htmlFor="actualStart">
              <input type="datetime-local" id="actualStart" name="actualStart" defaultValue={record?.actualStart?.toISOString().slice(0, 16) ?? ""} className={inputClass} />
            </Field>
            <Field label="Actual Finish" htmlFor="actualFinish">
              <input type="datetime-local" id="actualFinish" name="actualFinish" defaultValue={record?.actualFinish?.toISOString().slice(0, 16) ?? ""} className={inputClass} />
            </Field>
            <Field label="Status" htmlFor="status">
              <select id="status" name="status" defaultValue={record?.status ?? "PLANNED"} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        <Field label="Planned Hours" htmlFor="plannedHours">
          <input type="number" step="0.5" id="plannedHours" name="plannedHours" defaultValue={record?.plannedHours?.toString() ?? ""} className={inputClass} />
        </Field>
        {record && (
          <Field label="Actual Hours" htmlFor="actualHours">
            <input type="number" step="0.5" id="actualHours" name="actualHours" defaultValue={record?.actualHours?.toString() ?? ""} className={inputClass} />
          </Field>
        )}
      </div>

      {record && (
        <>
          <Field label="Findings" htmlFor="findingsText">
            <textarea id="findingsText" name="findingsText" defaultValue={record?.findingsText ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Corrective Action" htmlFor="correctiveAction">
            <textarea id="correctiveAction" name="correctiveAction" defaultValue={record?.correctiveAction ?? ""} rows={2} className={inputClass} />
          </Field>
        </>
      )}
      <Field label="Remarks" htmlFor="remarks">
        <textarea id="remarks" name="remarks" defaultValue={record?.remarks ?? ""} rows={2} className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          {record ? "Save Changes" : "Create PM Record"}
        </button>
        <Link href={record ? `/pm/${record.id}` : "/pm"} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
