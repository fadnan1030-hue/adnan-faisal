import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import { createHseObservation } from "../../actions";

export default async function NewHseObservationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("HSE", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/hse");

  const categories = await getConfigOptions(projectId, "HSE_OBSERVATION_CATEGORY");
  const areas = await getConfigOptions(projectId, "AREA");

  return (
    <div>
      <PageHeader title="New HSE Observation" />
      <form action={createHseObservation} className="max-w-2xl space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="date" required>
            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="Observer" htmlFor="observer">
            <input id="observer" name="observer" className={inputClass} />
          </Field>
          <Field label="Area" htmlFor="area">
            <input list="areas" id="area" name="area" className={inputClass} />
            <datalist id="areas">
              {areas.map((a) => (
                <option key={a.id} value={a.label} />
              ))}
            </datalist>
          </Field>
          <Field label="Equipment Tag (optional)" htmlFor="equipmentTag">
            <input id="equipmentTag" name="equipmentTag" className={inputClass} />
          </Field>
          <Field label="Category" htmlFor="category">
            <input list="obs-categories" id="category" name="category" className={inputClass} />
            <datalist id="obs-categories">
              {categories.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </Field>
          <Field label="Type" htmlFor="isPositive">
            <select id="isPositive" name="isPositive" defaultValue="false" className={inputClass}>
              <option value="true">Positive / Good Practice</option>
              <option value="false">Negative / Unsafe</option>
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
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Create Observation
          </button>
          <Link href="/hse" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
