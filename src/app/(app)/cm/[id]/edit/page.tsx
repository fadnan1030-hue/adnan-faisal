import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { CmForm } from "../../cm-form";
import { updateCmRecord } from "../../actions";

export default async function EditCmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("MAINTENANCE", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const record = await prisma.cmRecord.findUnique({ where: { id }, include: { equipment: true } });
  if (!record) notFound();

  return (
    <div>
      <PageHeader title={`Edit CM — ${record.equipment.tagNumber}`} />
      <CmForm projectId={record.projectId} record={record} action={updateCmRecord} error={error} />
    </div>
  );
}
