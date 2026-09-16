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
import type { MaintenanceStatus, WorkOrderType } from "@prisma/client";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const projectId = await getCurrentProjectId();
  const { q, status, type } = await searchParams;

  const orders = projectId
    ? await prisma.workOrder.findMany({
        where: {
          projectId,
          ...(q
            ? {
                OR: [
                  { workOrderNumber: { contains: q, mode: "insensitive" } },
                  { equipmentSortField: { contains: q, mode: "insensitive" } },
                  { scope: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(status ? { status: status as MaintenanceStatus } : {}),
          ...(type ? { type: type as WorkOrderType } : {}),
        },
        include: { equipment: { select: { tagNumber: true } } },
        orderBy: { plannedStartDate: "desc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  return (
    <div>
      <PageHeader
        title="Work Orders"
        description="Complete work order database (spec section 14)."
        actions={
          canWrite && (
            <Link href="/work-orders/new" className={buttonPrimaryClass}>
              + New Work Order
            </Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search WO #, equipment tag, or scope"
          className={`${inputClass} max-w-xs`}
        />
        <select name="type" defaultValue={type ?? ""} className={inputClass}>
          <option value="">All types</option>
          <option value="PM">PM</option>
          <option value="CM">CM</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "RESCHEDULED", "CANCELLED", "CLOSED"].map(
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
            <Th>WO #</Th>
            <Th>Type</Th>
            <Th>Equipment</Th>
            <Th>Scope</Th>
            <Th>Planned Start</Th>
            <Th>Planned / Actual Hrs</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={7} message="Select a project to view work orders." />}
          {projectId && orders.length === 0 && <EmptyRow colSpan={7} />}
          {orders.map((o) => (
            <tr key={o.id}>
              <Td>
                <Link href={`/work-orders/${o.id}`} className="font-medium text-blue-700 hover:underline">
                  {o.workOrderNumber}
                </Link>
              </Td>
              <Td>{o.type}</Td>
              <Td>{o.equipment?.tagNumber ?? o.equipmentSortField ?? "—"}</Td>
              <Td className="max-w-xs truncate">{o.scope ?? o.operationShortText ?? "—"}</Td>
              <Td>{formatDate(o.plannedStartDate)}</Td>
              <Td>
                {formatHours(o.plannedHours?.toString())} / {formatHours(o.actualHours?.toString())}
              </Td>
              <Td>
                <StatusBadge status={o.status} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
