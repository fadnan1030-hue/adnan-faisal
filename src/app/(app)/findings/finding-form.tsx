import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";

export async function NewFindingForm({
  projectId,
  defaults,
  error,
  action,
}: {
  projectId: string;
  defaults: {
    equipmentTag?: string;
    workOrderId?: string;
    pmRecordId?: string;
    cmRecordId?: string;
    inspectionId?: string;
  };
  error?: string;
  action: (formData: FormData) => void;
}) {
  const categories = await getConfigOptions(projectId, "FINDING_CATEGORY");

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <FormError message={error} />
      {defaults.workOrderId && <input type="hidden" name="workOrderId" value={defaults.workOrderId} />}
      {defaults.pmRecordId && <input type="hidden" name="pmRecordId" value={defaults.pmRecordId} />}
      {defaults.cmRecordId && <input type="hidden" name="cmRecordId" value={defaults.cmRecordId} />}
      {defaults.inspectionId && <input type="hidden" name="inspectionId" value={defaults.inspectionId} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EquipmentTagField projectId={projectId} defaultValue={defaults.equipmentTag} />
        <Field label="Date" htmlFor="date" required>
          <input type="date" id="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} />
        </Field>
        <Field label="Category" htmlFor="category" required>
          <input list="finding-categories" id="category" name="category" required className={inputClass} />
          <datalist id="finding-categories">
            {categories.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Severity" htmlFor="severity">
          <select id="severity" name="severity" defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>
        <Field label="Risk Level" htmlFor="riskLevel">
          <select id="riskLevel" name="riskLevel" defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>
        <Field label="Responsible Person" htmlFor="responsiblePerson">
          <input id="responsiblePerson" name="responsiblePerson" className={inputClass} />
        </Field>
        <Field label="Target Date" htmlFor="targetDate">
          <input type="date" id="targetDate" name="targetDate" className={inputClass} />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" required>
        <textarea id="description" name="description" rows={3} required className={inputClass} />
      </Field>
      <Field label="Immediate Action" htmlFor="immediateAction">
        <textarea id="immediateAction" name="immediateAction" rows={2} className={inputClass} />
      </Field>
      <Field label="Recommended Action" htmlFor="recommendedAction">
        <textarea id="recommendedAction" name="recommendedAction" rows={2} className={inputClass} />
      </Field>

      <Field label="Photographs" htmlFor="photos" hint="You can attach photos now or add more later from the finding page.">
        <input type="file" id="photos" name="photos" accept="image/*" multiple className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          Create Finding
        </button>
        <Link href="/findings" className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
