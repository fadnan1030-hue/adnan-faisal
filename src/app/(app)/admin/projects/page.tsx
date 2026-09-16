import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";

export default async function ProjectsPage() {
  const session = await requireModuleAccess("ADMINISTRATION", "read");
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
  const canWrite = can(session.user.role, "ADMINISTRATION", "write");

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Multi-project configuration (spec section 6)."
        actions={
          canWrite && (
            <Link href="/admin/projects/new" className={buttonPrimaryClass}>
              + New Project
            </Link>
          )
        }
      />

      <Table>
        <THead>
          <tr>
            <Th>Code</Th>
            <Th>Name</Th>
            <Th>Client</Th>
            <Th>Contractor</Th>
            <Th>Status</Th>
            <Th>Start</Th>
            <Th>Planned Completion</Th>
            <Th>LTI-Free Start</Th>
            <Th />
          </tr>
        </THead>
        <TBody>
          {projects.length === 0 && <EmptyRow colSpan={9} />}
          {projects.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium text-slate-900">{p.code}</Td>
              <Td>{p.name}</Td>
              <Td>{p.client ?? "—"}</Td>
              <Td>{p.contractor ?? "—"}</Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td>{formatDate(p.startDate)}</Td>
              <Td>{formatDate(p.plannedCompletionDate)}</Td>
              <Td>{formatDate(p.ltiFreeStartDate)}</Td>
              <Td>
                {canWrite && (
                  <Link href={`/admin/projects/${p.id}/edit`} className={buttonSecondaryClass}>
                    Edit
                  </Link>
                )}
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
