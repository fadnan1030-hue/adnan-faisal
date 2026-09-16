import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import Link from "next/link";
import { updateSceRecord } from "../../actions";

export default async function EditScePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("SCE", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const record = await prisma.sceRecord.findUnique({ where: { id }, include: { equipment: true } });
  if (!record) notFound();

  return (
    <div>
      <PageHeader title={`Edit SCE — ${record.equipment.tagNumber}`} />
      <form action={updateSceRecord} className="max-w-2xl space-y-4">
        <input type="hidden" name="id" value={record.id} />
        <FormError message={error} />
        <Field label="SCE Category" htmlFor="sceCategory" required>
          <input id="sceCategory" name="sceCategory" defaultValue={record.sceCategory} required className={inputClass} />
        </Field>
        <Field label="Critical Function" htmlFor="criticalFunction">
          <textarea id="criticalFunction" name="criticalFunction" defaultValue={record.criticalFunction ?? ""} rows={2} className={inputClass} />
        </Field>
        <Field label="Inspection Requirement" htmlFor="inspectionRequirement">
          <textarea id="inspectionRequirement" name="inspectionRequirement" defaultValue={record.inspectionRequirement ?? ""} rows={2} className={inputClass} />
        </Field>
        <Field label="Test Frequency" htmlFor="testFrequency">
          <input id="testFrequency" name="testFrequency" defaultValue={record.testFrequency ?? ""} className={inputClass} />
        </Field>
        <Field label="Responsible Person" htmlFor="responsiblePerson">
          <input id="responsiblePerson" name="responsiblePerson" defaultValue={record.responsiblePerson ?? ""} className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Save Changes
          </button>
          <Link href={`/sce/${id}`} className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
