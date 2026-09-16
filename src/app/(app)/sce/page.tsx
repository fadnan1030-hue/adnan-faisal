import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { getSceKpis } from "@/lib/kpi/engine";

export default async function ScePage() {
  await requireModuleAccess("SCE", "read");
  const projectId = await getCurrentProjectId();

  const [kpis, records] = projectId
    ? await Promise.all([
        getSceKpis(projectId),
        prisma.sceRecord.findMany({
          where: { projectId },
          include: { equipment: true },
          orderBy: { nextDueDate: "asc" },
        }),
      ])
    : [null, []];

  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Safety Critical Equipment (SCE)"
        description="Spec section 22 — mark equipment as SCE from the Equipment Master to register it here."
      />

      {kpis && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Total SCE" value={String(kpis.total)} />
          <StatCard label="Due" value={String(kpis.due)} tone="warning" />
          <StatCard label="Completed" value={String(kpis.completed)} tone="good" />
          <StatCard label="Overdue" value={String(kpis.overdue)} tone={kpis.overdue > 0 ? "critical" : "good"} />
          <StatCard label="Compliance %" value={kpis.compliancePct === null ? "N/A" : `${kpis.compliancePct.toFixed(1)}%`} />
        </div>
      )}

      <Table>
        <THead>
          <tr>
            <Th>Equipment</Th>
            <Th>Category</Th>
            <Th>Last Test</Th>
            <Th>Next Due</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={5} message="Select a project to view SCE." />}
          {projectId && records.length === 0 && <EmptyRow colSpan={5} message="No equipment marked as SCE yet." />}
          {records.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/sce/${r.id}`} className="font-medium text-blue-700 hover:underline">
                  {r.equipment.tagNumber}
                </Link>
              </Td>
              <Td>{r.sceCategory}</Td>
              <Td>{formatDate(r.lastTestDate)}</Td>
              <Td>{formatDate(r.nextDueDate)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <StatusBadge status={r.status} />
                  {r.nextDueDate && r.nextDueDate < now && r.status !== "VERIFIED" && <StatusBadge status="OVERDUE" />}
                </div>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
