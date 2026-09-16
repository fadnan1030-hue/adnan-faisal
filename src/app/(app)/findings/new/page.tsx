import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { NewFindingForm } from "../finding-form";
import { createFinding } from "../actions";

export default async function NewFindingPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    equipmentTag?: string;
    workOrderId?: string;
    pmRecordId?: string;
    cmRecordId?: string;
    inspectionId?: string;
  }>;
}) {
  await requireModuleAccess("FINDINGS", "write");
  const projectId = await getCurrentProjectId();
  const params = await searchParams;
  if (!projectId) redirect("/findings");

  return (
    <div>
      <PageHeader title="New Finding" />
      <NewFindingForm projectId={projectId} defaults={params} error={params.error} action={createFinding} />
    </div>
  );
}
