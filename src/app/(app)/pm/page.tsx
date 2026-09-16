import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass, inputClass } from "@/components/ui/form";
import { formatDate, formatHours } from "@/lib/format";
import { can } from "@/lib/rbac";
import type { MaintenanceStatus } from "@prisma/client";

export default async function PmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const projectId = await getCurrentProjectId();
  const { status } = await searchParams;

  const records = projectId
    ? await prisma.pmRecord.findMany({
        where: { projectId, ...(status ? { status: status as MaintenanceStatus } : {}) },
        include: { equipment: { select: { tagNumber: true, id: true } } },
        orderBy: { plannedDate: "desc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  return (
    <div>
      <PageHeader
        title="Preventive Maintenance (PM)"
        description="Spec section 12."
        actions={
          canWrite && (
            <Link href="/pm/new" className={buttonPrimaryClass}>
              + New PM
            </Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "PARTIALLY_COMPLETED", "RESCHEDULED", "CANCELLED", "OVERDUE"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <button type="submit" className={buttonPrimaryClass}>
          Filter
        </button>
      </form>

      <Table>
        <THead>
          <tr>
            <Th>Planned Date</Th>
            <Th>Equipment</Th>
            <Th>PM Type</Th>
            <Th>Discipline</Th>
            <Th>Planned / Actual Hrs</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={6} message="Select a project to view PM records." />}
          {projectId && records.length === 0 && <EmptyRow colSpan={6} />}
          {records.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/pm/${r.id}`} className="font-medium text-indigo-700 hover:underline">
                  {formatDate(r.plannedDate)}
                </Link>
              </Td>
              <Td>
                {r.equipment && (
                  <Link href={`/equipment/${r.equipment.id}`} className="hover:underline">
                    {r.equipment.tagNumber}
                  </Link>
                )}
              </Td>
              <Td>{r.pmType ?? "—"}</Td>
              <Td>{r.responsibleDiscipline ?? "—"}</Td>
              <Td>
                {formatHours(r.plannedHours?.toString())} / {formatHours(r.actualHours?.toString())}
              </Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
