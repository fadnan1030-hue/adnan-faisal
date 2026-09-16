import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PmForm } from "../../pm-form";
import { updatePmRecord } from "../../actions";

export default async function EditPmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("MAINTENANCE", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const record = await prisma.pmRecord.findUnique({ where: { id }, include: { equipment: true } });
  if (!record) notFound();

  return (
    <div>
      <PageHeader title={`Edit PM — ${record.equipment.tagNumber}`} />
      <PmForm projectId={record.projectId} record={record} action={updatePmRecord} error={error} />
    </div>
  );
}
