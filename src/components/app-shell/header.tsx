import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { ProjectSelector } from "@/components/app-shell/project-selector";
import { SignOutButton } from "@/components/app-shell/sign-out-button";

export async function Header({
  currentProjectId,
  userName,
  role,
}: {
  currentProjectId: string | null;
  userName: string;
  role: Role;
}) {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <ProjectSelector projects={projects} currentProjectId={currentProjectId} />

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-800">{userName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
