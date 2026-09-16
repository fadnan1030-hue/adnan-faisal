import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EquipmentForm } from "../../equipment-form";
import { updateEquipment } from "../../actions";

export default async function EditEquipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("EQUIPMENT", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) notFound();

  return (
    <div>
      <PageHeader title={`Edit Equipment — ${equipment.tagNumber}`} />
      <EquipmentForm projectId={equipment.projectId} equipment={equipment} action={updateEquipment} error={error} />
    </div>
  );
}
