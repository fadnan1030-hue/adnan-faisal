import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { NewActionForm } from "../action-form";
import { createAction } from "../actions";

export default async function NewActionPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    equipmentTag?: string;
    findingId?: string;
    workOrderId?: string;
    pmRecordId?: string;
    cmRecordId?: string;
    sourceModule?: string;
    returnTo?: string;
  }>;
}) {
  await requireModuleAccess("ACTIONS", "write");
  const projectId = await getCurrentProjectId();
  const params = await searchParams;
  if (!projectId) redirect("/actions");

  return (
    <div>
      <PageHeader title="New Action" />
      <NewActionForm projectId={projectId} defaults={params} error={params.error} action={createAction} />
    </div>
  );
}
