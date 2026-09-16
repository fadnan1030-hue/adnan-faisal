import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import Link from "next/link";
import { createHseIncident } from "../../actions";

const TYPES = ["LTI", "TRIF_RECORDABLE", "FIRST_AID", "MEDICAL_TREATMENT", "NEAR_MISS", "OTHER"];

export default async function NewHseIncidentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("HSE", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/hse");

  return (
    <div>
      <PageHeader title="Report HSE Incident" />
      <form action={createHseIncident} className="max-w-2xl space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Incident Date" htmlFor="incidentDate" required>
            <input type="date" id="incidentDate" name="incidentDate" required className={inputClass} />
          </Field>
          <Field label="Incident Type" htmlFor="incidentType" required>
            <select id="incidentType" name="incidentType" defaultValue="OTHER" className={inputClass}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" name="location" className={inputClass} />
          </Field>
          <Field label="Personnel Affected" htmlFor="personnelAffected">
            <input id="personnelAffected" name="personnelAffected" className={inputClass} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" required>
          <textarea id="description" name="description" rows={3} required className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Report Incident
          </button>
          <Link href="/hse" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
