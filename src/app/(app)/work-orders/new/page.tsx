import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { WorkOrderForm } from "../work-order-form";
import { createWorkOrder } from "../actions";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/work-orders");

  return (
    <div>
      <PageHeader title="New Work Order" />
      <WorkOrderForm projectId={projectId} action={createWorkOrder} error={error} />
    </div>
  );
}
