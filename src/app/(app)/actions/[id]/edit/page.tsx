import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EditActionForm } from "../../action-form";
import { updateAction } from "../../actions";

export default async function EditActionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("ACTIONS", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const record = await prisma.action.findUnique({ where: { id }, include: { equipment: true } });
  if (!record) notFound();

  return (
    <div>
      <PageHeader title="Update Action" />
      <EditActionForm record={record} action={updateAction} error={error} />
    </div>
  );
}
