import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import { createQcInspection } from "../../actions";

export default async function NewQcInspectionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("QC", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/qc");

  const types = await getConfigOptions(projectId, "QC_INSPECTION_TYPE");

  return (
    <div>
      <PageHeader title="New QC Inspection" />
      <form action={createQcInspection} className="max-w-2xl space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="date" required>
            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="Inspection Type" htmlFor="inspectionType">
            <input list="qc-types" id="inspectionType" name="inspectionType" className={inputClass} />
            <datalist id="qc-types">
              {types.map((t) => (
                <option key={t.id} value={t.label} />
              ))}
            </datalist>
          </Field>
          <Field label="Equipment Tag" htmlFor="equipmentTag">
            <input id="equipmentTag" name="equipmentTag" className={inputClass} />
          </Field>
          <Field label="Inspector" htmlFor="inspector">
            <input id="inspector" name="inspector" className={inputClass} />
          </Field>
          <Field label="Result" htmlFor="result">
            <select id="result" name="result" defaultValue="PENDING" className={inputClass}>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="PENDING">Pending</option>
            </select>
          </Field>
        </div>
        <Field label="Remarks" htmlFor="remarks">
          <textarea id="remarks" name="remarks" rows={2} className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Create Inspection
          </button>
          <Link href="/qc" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
