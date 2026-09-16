import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default async function AdminPage() {
  await requireModuleAccess("ADMINISTRATION", "read");

  const [users, equipment, workOrders, documents, photos, projects, recentImports] =
    await Promise.all([
      prisma.user.count(),
      prisma.equipment.count(),
      prisma.workOrder.count(),
      prisma.document.count(),
      prisma.photo.count(),
      prisma.project.count(),
      prisma.importJob.count({ where: { status: { not: "COMPLETED" } } }),
    ]);

  const sections = [
    { title: "Projects", description: "Manage projects, contract details and reporting periods.", href: "/admin/projects" },
    { title: "Users", description: "Manage user accounts, roles and active status.", href: "/admin/users" },
    { title: "Configuration", description: "Areas, units, disciplines, work centers, finding categories and other configurable lists.", href: "/admin/config" },
    { title: "Contractors & Employees", description: "Manage contractor companies and workforce records.", href: "/admin/employees" },
    { title: "Audit Trail", description: "Review the full change history across the system.", href: "/admin/audit" },
  ];

  return (
    <div>
      <PageHeader
        title="Administration"
        description="System configuration, user management and platform health (spec section 81)."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Projects" value={String(projects)} />
        <StatCard label="Users" value={String(users)} />
        <StatCard label="Equipment" value={String(equipment)} />
        <StatCard label="Work Orders" value={String(workOrders)} />
        <StatCard label="Attachments" value={String(documents + photos)} sublabel={`${photos} photos, ${documents} docs`} />
        <StatCard
          label="Pending Imports"
          value={String(recentImports)}
          tone={recentImports > 0 ? "warning" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
