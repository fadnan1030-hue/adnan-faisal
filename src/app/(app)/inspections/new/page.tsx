import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { EquipmentTagField } from "@/components/equipment-tag-field";
import Link from "next/link";
import { createInspection } from "../actions";

export default async function NewInspectionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("INSPECTIONS", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/inspections");

  return (
    <div>
      <PageHeader title="New Inspection" />
      <form action={createInspection} className="max-w-2xl space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EquipmentTagField projectId={projectId} />
          <Field label="Date" htmlFor="date" required>
            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="Type" htmlFor="type">
            <select id="type" name="type" defaultValue="GENERAL" className={inputClass}>
              <option value="GENERAL">General</option>
              <option value="QC">QC</option>
              <option value="SCE">SCE</option>
              <option value="HSE">HSE</option>
            </select>
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
          <Link href="/inspections" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
