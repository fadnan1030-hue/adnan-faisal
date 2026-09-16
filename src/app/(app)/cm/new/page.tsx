import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { CmForm } from "../cm-form";
import { createCmRecord } from "../actions";

export default async function NewCmPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/cm");

  return (
    <div>
      <PageHeader title="Report Breakdown / New CM" />
      <CmForm projectId={projectId} action={createCmRecord} error={error} />
    </div>
  );
}
