import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { ProjectSelector } from "@/components/app-shell/project-selector";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";

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
    <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
      <ProjectSelector projects={projects} currentProjectId={currentProjectId} />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-ink-strong">{userName}</p>
          <p className="text-xs text-ink-muted">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-ink-soft">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
