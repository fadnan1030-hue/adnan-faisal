import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import { createNcr } from "../../actions";

export default async function NewNcrPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("QC", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/qc");

  const categories = await getConfigOptions(projectId, "NCR_CATEGORY");

  return (
    <div>
      <PageHeader title="New NCR" />
      <form action={createNcr} className="max-w-2xl space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="NCR #" htmlFor="ncrNumber" required>
            <input id="ncrNumber" name="ncrNumber" required className={inputClass} />
          </Field>
          <Field label="Date" htmlFor="date" required>
            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="Equipment Tag" htmlFor="equipmentTag">
            <input id="equipmentTag" name="equipmentTag" className={inputClass} />
          </Field>
          <Field label="Category" htmlFor="category">
            <input list="ncr-categories" id="category" name="category" className={inputClass} />
            <datalist id="ncr-categories">
              {categories.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </Field>
          <Field label="Severity" htmlFor="severity">
            <select id="severity" name="severity" defaultValue="MINOR" className={inputClass}>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
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
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Create NCR
          </button>
          <Link href="/qc" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
