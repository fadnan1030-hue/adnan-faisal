import { requireModuleAccess } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "../project-form";
import { createProject } from "../actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModuleAccess("ADMINISTRATION", "write");
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title="New Project" description="Create a new project configuration." />
      <ProjectForm action={createProject} error={error} />
    </div>
  );
}
