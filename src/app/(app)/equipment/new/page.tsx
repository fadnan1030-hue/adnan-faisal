import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { EquipmentForm } from "../equipment-form";
import { createEquipment } from "../actions";

export default async function NewEquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("EQUIPMENT", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/equipment");

  return (
    <div>
      <PageHeader title="New Equipment" description="Add a new equipment record to the master list." />
      <EquipmentForm projectId={projectId} action={createEquipment} error={error} />
    </div>
  );
}
