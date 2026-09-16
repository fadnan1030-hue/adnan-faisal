import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";

export default async function MaintenanceOverviewPage() {
  await requireModuleAccess("MAINTENANCE", "read");
  const projectId = await getCurrentProjectId();

  const [pmOpen, cmOpen, woOpen, overdue, recentActivity] = projectId
    ? await Promise.all([
        prisma.pmRecord.count({ where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } } }),
        prisma.cmRecord.count({ where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } } }),
        prisma.workOrder.count({ where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } } }),
        prisma.workOrder.count({
          where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] }, plannedFinishDate: { lt: new Date() } },
        }),
        prisma.workOrder.findMany({
          where: { projectId },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: { equipment: { select: { tagNumber: true } } },
        }),
      ])
    : [0, 0, 0, 0, []];

  return (
    <div>
      <PageHeader
        title="Maintenance Overview"
        description="Jump into PM, CM, Work Orders and Daily Planning."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open PM" value={String(pmOpen)} href="/pm" />
        <StatCard label="Open CM" value={String(cmOpen)} href="/cm" />
        <StatCard label="Open Work Orders" value={String(woOpen)} href="/work-orders" />
        <StatCard label="Overdue Work Orders" value={String(overdue)} tone={overdue > 0 ? "critical" : "good"} href="/work-orders?status=OVERDUE" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "PM", href: "/pm", desc: "Preventive maintenance records" },
          { label: "CM", href: "/cm", desc: "Corrective maintenance / breakdowns" },
          { label: "Work Orders", href: "/work-orders", desc: "Full work order database" },
          { label: "Daily Planning", href: "/daily-planning", desc: "Today / tomorrow / overdue jobs" },
        ].map((m) => (
          <Link key={m.href} href={m.href} className="rounded-xl border border-line bg-surface p-4 shadow-sm hover:shadow-md">
            <h3 className="text-sm font-semibold text-ink-strong">{m.label}</h3>
            <p className="mt-1 text-xs text-ink-muted">{m.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-ink">Recently Updated Work Orders</h2>
      <Table>
        <THead>
          <tr>
            <Th>WO #</Th>
            <Th>Equipment</Th>
            <Th>Scope</Th>
            <Th>Planned Finish</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {recentActivity.length === 0 && <EmptyRow colSpan={5} />}
          {recentActivity.map((o) => (
            <tr key={o.id}>
              <Td>
                <Link href={`/work-orders/${o.id}`} className="text-indigo-700 hover:underline">
                  {o.workOrderNumber}
                </Link>
              </Td>
              <Td>{o.equipment?.tagNumber ?? o.equipmentSortField ?? "—"}</Td>
              <Td className="max-w-xs truncate">{o.scope ?? o.operationShortText ?? "—"}</Td>
              <Td>{formatDate(o.plannedFinishDate)}</Td>
              <Td><StatusBadge status={o.status} /></Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
