import { requireSession } from "@/lib/auth-helpers";
import { getCurrentProject } from "@/lib/current-project";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Header } from "@/components/app-shell/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const project = await getCurrentProject();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          currentProjectId={project?.id ?? null}
          userName={session.user.name ?? session.user.email ?? "User"}
          role={session.user.role}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
