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

export default async function CmPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const projectId = await getCurrentProjectId();
  const { status } = await searchParams;

  const records = projectId
    ? await prisma.cmRecord.findMany({
        where: { projectId, ...(status ? { status: status as MaintenanceStatus } : {}) },
        include: { equipment: { select: { tagNumber: true, id: true } } },
        orderBy: { breakdownDate: "desc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  return (
    <div>
      <PageHeader
        title="Corrective Maintenance (CM)"
        description="Spec section 13."
        actions={
          canWrite && (
            <Link href="/cm/new" className={buttonPrimaryClass}>
              + New CM
            </Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "RESCHEDULED", "CANCELLED", "OVERDUE"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonPrimaryClass}>
          Filter
        </button>
      </form>

      <Table>
        <THead>
          <tr>
            <Th>Breakdown Date</Th>
            <Th>Equipment</Th>
            <Th>Failure Description</Th>
            <Th>Priority</Th>
            <Th>Downtime</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={6} message="Select a project to view CM records." />}
          {projectId && records.length === 0 && <EmptyRow colSpan={6} />}
          {records.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/cm/${r.id}`} className="font-medium text-indigo-700 hover:underline">
                  {formatDate(r.breakdownDate)}
                </Link>
              </Td>
              <Td>
                {r.equipment && (
                  <Link href={`/equipment/${r.equipment.id}`} className="hover:underline">
                    {r.equipment.tagNumber}
                  </Link>
                )}
              </Td>
              <Td className="max-w-xs truncate">{r.failureDescription ?? "—"}</Td>
              <Td>
                <StatusBadge status={r.priority} />
              </Td>
              <Td>{formatHours(r.downtimeHours?.toString())}</Td>
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
