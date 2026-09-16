import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import { toInputDate } from "@/lib/format";
import Link from "next/link";
import type { CmRecord } from "@prisma/client";

const STATUSES = ["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "RESCHEDULED", "CANCELLED", "OVERDUE"];

export async function CmForm({
  projectId,
  record,
  action,
  error,
}: {
  projectId: string;
  record?: CmRecord & { equipment?: { tagNumber: string } | null };
  action: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <form action={action} className="max-w-4xl space-y-6">
      {record && <input type="hidden" name="id" value={record.id} />}
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <EquipmentTagField projectId={projectId} defaultValue={record?.equipment?.tagNumber} required={!record} />

        <Field label="Breakdown Date" htmlFor="breakdownDate" required>
          <input
            type="date"
            id="breakdownDate"
            name="breakdownDate"
            defaultValue={toInputDate(record?.breakdownDate)}
            disabled={!!record}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Notification Date" htmlFor="notificationDate">
          <input
            type="date"
            id="notificationDate"
            name="notificationDate"
            defaultValue={toInputDate(record?.notificationDate)}
            className={inputClass}
          />
        </Field>

        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={record?.priority ?? "MEDIUM"} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
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
            <Field label="Planned Hours" htmlFor="plannedHours">
              <input type="number" step="0.5" id="plannedHours" name="plannedHours" defaultValue={record?.plannedHours?.toString() ?? ""} className={inputClass} />
            </Field>
            <Field label="Actual Hours" htmlFor="actualHours">
              <input type="number" step="0.5" id="actualHours" name="actualHours" defaultValue={record?.actualHours?.toString() ?? ""} className={inputClass} />
            </Field>
            <Field label="Downtime Hours" htmlFor="downtimeHours">
              <input type="number" step="0.5" id="downtimeHours" name="downtimeHours" defaultValue={record?.downtimeHours?.toString() ?? ""} className={inputClass} />
            </Field>
          </>
        )}
      </div>

      <Field label="Failure Description" htmlFor="failureDescription">
        <textarea id="failureDescription" name="failureDescription" defaultValue={record?.failureDescription ?? ""} rows={2} className={inputClass} />
      </Field>
      <Field label="Problem Statement" htmlFor="problemStatement">
        <textarea id="problemStatement" name="problemStatement" defaultValue={record?.problemStatement ?? ""} rows={2} className={inputClass} />
      </Field>

      {record && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Finding" htmlFor="finding">
              <textarea id="finding" name="finding" defaultValue={record?.finding ?? ""} rows={2} className={inputClass} />
            </Field>
            <Field label="Failure Mode" htmlFor="failureMode">
              <input id="failureMode" name="failureMode" defaultValue={record?.failureMode ?? ""} className={inputClass} />
            </Field>
            <Field label="Root Cause" htmlFor="rootCause">
              <textarea id="rootCause" name="rootCause" defaultValue={record?.rootCause ?? ""} rows={2} className={inputClass} />
            </Field>
            <Field label="Corrective Action" htmlFor="correctiveAction">
              <textarea id="correctiveAction" name="correctiveAction" defaultValue={record?.correctiveAction ?? ""} rows={2} className={inputClass} />
            </Field>
            <Field label="Spare Parts" htmlFor="spareParts">
              <input id="spareParts" name="spareParts" defaultValue={record?.spareParts ?? ""} className={inputClass} />
            </Field>
            <Field label="Production Impact" htmlFor="productionImpact">
              <input id="productionImpact" name="productionImpact" defaultValue={record?.productionImpact ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Recommendation" htmlFor="recommendation">
            <textarea id="recommendation" name="recommendation" defaultValue={record?.recommendation ?? ""} rows={2} className={inputClass} />
          </Field>
        </>
      )}

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          {record ? "Save Changes" : "Create CM Record"}
        </button>
        <Link href={record ? `/cm/${record.id}` : "/cm"} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
