import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EditFindingForm } from "../../edit-finding-form";
import { updateFinding } from "../../actions";

export default async function EditFindingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("FINDINGS", "write");
  const { id } = await params;
  const { error } = await searchParams;

  const finding = await prisma.finding.findUnique({ where: { id } });
  if (!finding) notFound();

  return (
    <div>
      <PageHeader title="Update Finding" />
      <EditFindingForm projectId={finding.projectId} finding={finding} action={updateFinding} error={error} />
    </div>
  );
}
