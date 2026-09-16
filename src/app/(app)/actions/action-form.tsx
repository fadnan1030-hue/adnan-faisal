import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import { toInputDate } from "@/lib/format";
import Link from "next/link";
import type { Action } from "@prisma/client";

const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED", "CANCELLED"];

export async function NewActionForm({
  projectId,
  defaults,
  action,
  error,
}: {
  projectId: string;
  defaults: {
    equipmentTag?: string;
    findingId?: string;
    workOrderId?: string;
    pmRecordId?: string;
    cmRecordId?: string;
    sourceModule?: string;
    returnTo?: string;
  };
  action: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      <FormError message={error} />
      {defaults.findingId && <input type="hidden" name="findingId" value={defaults.findingId} />}
      {defaults.workOrderId && <input type="hidden" name="workOrderId" value={defaults.workOrderId} />}
      {defaults.pmRecordId && <input type="hidden" name="pmRecordId" value={defaults.pmRecordId} />}
      {defaults.cmRecordId && <input type="hidden" name="cmRecordId" value={defaults.cmRecordId} />}
      {defaults.sourceModule && <input type="hidden" name="sourceModule" value={defaults.sourceModule} />}
      {defaults.returnTo && <input type="hidden" name="returnTo" value={defaults.returnTo} />}

      <EquipmentTagField projectId={projectId} defaultValue={defaults.equipmentTag} />

      <Field label="Description" htmlFor="description" required>
        <textarea id="description" name="description" rows={3} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Responsible Person" htmlFor="responsiblePerson">
          <input id="responsiblePerson" name="responsiblePerson" className={inputClass} />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </Field>
        <Field label="Target Date" htmlFor="targetDate">
          <input type="date" id="targetDate" name="targetDate" className={inputClass} />
        </Field>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          Create Action
        </button>
        <Link href={defaults.returnTo ?? "/actions"} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function EditActionForm({
  record,
  action,
  error,
}: {
  record: Action & { equipment?: { tagNumber: string } | null };
  action: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      <input type="hidden" name="id" value={record.id} />
      <FormError message={error} />

      <Field label="Description" htmlFor="description" required>
        <textarea id="description" name="description" defaultValue={record.description} rows={3} required className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Responsible Person" htmlFor="responsiblePerson">
          <input id="responsiblePerson" name="responsiblePerson" defaultValue={record.responsiblePerson ?? ""} className={inputClass} />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={record.priority} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </Field>
        <Field label="Target Date" htmlFor="targetDate">
          <input type="date" id="targetDate" name="targetDate" defaultValue={toInputDate(record.targetDate)} className={inputClass} />
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={record.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Closure Date" htmlFor="closureDate">
          <input type="date" id="closureDate" name="closureDate" defaultValue={toInputDate(record.closureDate)} className={inputClass} />
        </Field>
        <Field label="Verified By" htmlFor="verifiedBy">
          <input id="verifiedBy" name="verifiedBy" defaultValue={record.verifiedBy ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Closure Evidence" htmlFor="closureEvidence" hint="Required to close the action.">
        <textarea id="closureEvidence" name="closureEvidence" defaultValue={record.closureEvidence ?? ""} rows={2} className={inputClass} />
      </Field>
      <Field label="Remarks" htmlFor="remarks">
        <textarea id="remarks" name="remarks" defaultValue={record.remarks ?? ""} rows={2} className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          Save Changes
        </button>
        <Link href={`/actions/${record.id}`} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
