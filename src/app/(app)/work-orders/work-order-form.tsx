import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import { toInputDate } from "@/lib/format";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import type { WorkOrder } from "@prisma/client";

const STATUSES = [
  "PLANNED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "RESCHEDULED",
  "CANCELLED",
  "OVERDUE",
  "VERIFIED",
  "CLOSED",
];

export async function WorkOrderForm({
  projectId,
  workOrder,
  action,
  error,
}: {
  projectId: string;
  workOrder?: WorkOrder & { equipment?: { tagNumber: string } | null };
  action: (formData: FormData) => void;
  error?: string;
}) {
  const workCenters = await getConfigOptions(projectId, "WORK_CENTER");

  return (
    <form action={action} className="max-w-4xl space-y-6">
      {workOrder && <input type="hidden" name="id" value={workOrder.id} />}
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Work Order #" htmlFor="workOrderNumber" required>
          <input
            id="workOrderNumber"
            name="workOrderNumber"
            defaultValue={workOrder?.workOrderNumber}
            disabled={!!workOrder}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Type" htmlFor="type">
          <select id="type" name="type" defaultValue={workOrder?.type ?? "PM"} className={inputClass}>
            <option value="PM">PM</option>
            <option value="CM">CM</option>
          </select>
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={workOrder?.priority ?? "MEDIUM"} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </Field>

        <EquipmentTagField projectId={projectId} defaultValue={workOrder?.equipment?.tagNumber} />

        <Field label="Work Center" htmlFor="workCenter">
          <input list="work-centers" id="workCenter" name="workCenter" defaultValue={workOrder?.workCenter ?? ""} className={inputClass} />
          <datalist id="work-centers">
            {workCenters.map((w) => (
              <option key={w.id} value={w.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={workOrder?.location ?? ""} className={inputClass} />
        </Field>

        <Field label="Operation Short Text" htmlFor="operationShortText">
          <input
            id="operationShortText"
            name="operationShortText"
            defaultValue={workOrder?.operationShortText ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="ABC Indicator" htmlFor="abcIndicator">
          <input id="abcIndicator" name="abcIndicator" defaultValue={workOrder?.abcIndicator ?? ""} className={inputClass} />
        </Field>
        <Field label="Responsible Party" htmlFor="responsibleParty">
          <input
            id="responsibleParty"
            name="responsibleParty"
            defaultValue={workOrder?.responsibleParty ?? ""}
            className={inputClass}
          />
        </Field>

        <div className="sm:col-span-3">
          <Field label="Scope / Operation Description" htmlFor="scope">
            <textarea id="scope" name="scope" defaultValue={workOrder?.scope ?? ""} rows={2} className={inputClass} />
          </Field>
        </div>

        <Field label="Planned Start" htmlFor="plannedStartDate">
          <input
            type="date"
            id="plannedStartDate"
            name="plannedStartDate"
            defaultValue={toInputDate(workOrder?.plannedStartDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Planned Finish" htmlFor="plannedFinishDate">
          <input
            type="date"
            id="plannedFinishDate"
            name="plannedFinishDate"
            defaultValue={toInputDate(workOrder?.plannedFinishDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Earliest Finish Date" htmlFor="earliestFinishDate">
          <input
            type="date"
            id="earliestFinishDate"
            name="earliestFinishDate"
            defaultValue={toInputDate(workOrder?.earliestFinishDate)}
            className={inputClass}
          />
        </Field>

        {workOrder && (
          <>
            <Field label="Actual Start" htmlFor="actualStartDate">
              <input
                type="date"
                id="actualStartDate"
                name="actualStartDate"
                defaultValue={toInputDate(workOrder?.actualStartDate)}
                className={inputClass}
              />
            </Field>
            <Field label="Actual Finish" htmlFor="actualFinishDate">
              <input
                type="date"
                id="actualFinishDate"
                name="actualFinishDate"
                defaultValue={toInputDate(workOrder?.actualFinishDate)}
                className={inputClass}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <select id="status" name="status" defaultValue={workOrder?.status ?? "PLANNED"} className={inputClass}>
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
          <input
            type="number"
            step="0.5"
            id="plannedHours"
            name="plannedHours"
            defaultValue={workOrder?.plannedHours?.toString() ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Actual Hours" htmlFor="actualHours">
          <input
            type="number"
            step="0.5"
            id="actualHours"
            name="actualHours"
            defaultValue={workOrder?.actualHours?.toString() ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Remarks" htmlFor="remarks">
        <textarea id="remarks" name="remarks" defaultValue={workOrder?.remarks ?? ""} rows={2} className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          {workOrder ? "Save Changes" : "Create Work Order"}
        </button>
        <Link href={workOrder ? `/work-orders/${workOrder.id}` : "/work-orders"} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
