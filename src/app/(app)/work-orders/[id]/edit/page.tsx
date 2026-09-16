import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { WorkOrderForm } from "../../work-order-form";
import { updateWorkOrder } from "../../actions";

export default async function EditWorkOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("MAINTENANCE", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const workOrder = await prisma.workOrder.findUnique({ where: { id }, include: { equipment: true } });
  if (!workOrder) notFound();

  return (
    <div>
      <PageHeader title={`Edit Work Order ${workOrder.workOrderNumber}`} />
      <WorkOrderForm projectId={workOrder.projectId} workOrder={workOrder} action={updateWorkOrder} error={error} />
    </div>
  );
}
