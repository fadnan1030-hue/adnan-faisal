import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { toInputDate } from "@/lib/format";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import type { Finding } from "@prisma/client";

const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED", "CANCELLED"];

export async function EditFindingForm({
  projectId,
  finding,
  action,
  error,
}: {
  projectId: string;
  finding: Finding;
  action: (formData: FormData) => void;
  error?: string;
}) {
  const categories = await getConfigOptions(projectId, "FINDING_CATEGORY");

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={finding.id} />
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" required>
          <input list="finding-categories" id="category" name="category" defaultValue={finding.category} required className={inputClass} />
          <datalist id="finding-categories">
            {categories.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Severity" htmlFor="severity">
          <select id="severity" name="severity" defaultValue={finding.severity} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>
        <Field label="Risk Level" htmlFor="riskLevel">
          <select id="riskLevel" name="riskLevel" defaultValue={finding.riskLevel} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={finding.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsible Person" htmlFor="responsiblePerson">
          <input id="responsiblePerson" name="responsiblePerson" defaultValue={finding.responsiblePerson ?? ""} className={inputClass} />
        </Field>
        <Field label="Target Date" htmlFor="targetDate">
          <input type="date" id="targetDate" name="targetDate" defaultValue={toInputDate(finding.targetDate)} className={inputClass} />
        </Field>
        <Field label="Closure Date" htmlFor="closureDate">
          <input type="date" id="closureDate" name="closureDate" defaultValue={toInputDate(finding.closureDate)} className={inputClass} />
        </Field>
        <Field label="Verified By" htmlFor="verifiedBy">
          <input id="verifiedBy" name="verifiedBy" defaultValue={finding.verifiedBy ?? ""} className={inputClass} />
        </Field>
        <Field label="Verification Date" htmlFor="verificationDate">
          <input type="date" id="verificationDate" name="verificationDate" defaultValue={toInputDate(finding.verificationDate)} className={inputClass} />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" required>
        <textarea id="description" name="description" defaultValue={finding.description} rows={3} required className={inputClass} />
      </Field>
      <Field label="Immediate Action" htmlFor="immediateAction">
        <textarea id="immediateAction" name="immediateAction" defaultValue={finding.immediateAction ?? ""} rows={2} className={inputClass} />
      </Field>
      <Field label="Recommended Action" htmlFor="recommendedAction">
        <textarea id="recommendedAction" name="recommendedAction" defaultValue={finding.recommendedAction ?? ""} rows={2} className={inputClass} />
      </Field>
      <Field label="Remarks" htmlFor="remarks">
        <textarea id="remarks" name="remarks" defaultValue={finding.remarks ?? ""} rows={2} className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          Save Changes
        </button>
        <Link href={`/findings/${finding.id}`} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
