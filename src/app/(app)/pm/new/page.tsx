import { redirect } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { PageHeader } from "@/components/ui/page-header";
import { PmForm } from "../pm-form";
import { createPmRecord } from "../actions";

export default async function NewPmPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  if (!projectId) redirect("/pm");

  return (
    <div>
      <PageHeader title="New PM Record" />
      <PmForm projectId={projectId} action={createPmRecord} error={error} />
    </div>
  );
}
