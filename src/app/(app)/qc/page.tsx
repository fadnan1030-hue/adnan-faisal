import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { getQcKpis } from "@/lib/kpi/engine";
import { resolvePeriod } from "@/lib/kpi/period";
import { formatPercent } from "@/lib/format";
import { can } from "@/lib/rbac";

export default async function QcPage() {
  const session = await requireModuleAccess("QC", "read");
  const projectId = await getCurrentProjectId();
  const canWrite = can(session.user.role, "QC", "write");

  const yearRange = resolvePeriod("YEARLY");

  const [kpis, inspections, ncrs] = projectId
    ? await Promise.all([
        getQcKpis(projectId, yearRange),
        prisma.qcInspection.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 10 }),
        prisma.ncr.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 10 }),
      ])
    : [null, [], []];

  return (
    <div>
      <PageHeader
        title="QC / QA"
        description="Quality inspections and NCRs (spec section 27)."
        actions={
          canWrite && (
            <div className="flex gap-2">
              <Link href="/qc/inspections/new" className={buttonPrimaryClass}>
                + Inspection
              </Link>
              <Link href="/qc/ncrs/new" className={buttonPrimaryClass}>
                + NCR
              </Link>
            </div>
          )
        }
      />

      {kpis && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Inspections (YTD)" value={String(kpis.inspections)} />
          <StatCard label="Open NCRs" value={String(kpis.ncrsOpen)} tone={kpis.ncrsOpen > 0 ? "warning" : "good"} />
          <StatCard label="NCR Closure %" value={formatPercent(kpis.ncrClosurePct)} tone="good" />
          <StatCard label="Open QC Actions" value={String(kpis.openQcActions)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Recent Inspections</h2>
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Equipment</Th>
                <Th>Result</Th>
              </tr>
            </THead>
            <TBody>
              {inspections.length === 0 && <EmptyRow colSpan={4} />}
              {inspections.map((i) => (
                <tr key={i.id}>
                  <Td>{formatDate(i.date)}</Td>
                  <Td>{i.inspectionType ?? "—"}</Td>
                  <Td>{i.equipmentTag ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={i.result} />
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Non-Conformance Reports</h2>
          <Table>
            <THead>
              <tr>
                <Th>NCR #</Th>
                <Th>Description</Th>
                <Th>Severity</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {ncrs.length === 0 && <EmptyRow colSpan={4} />}
              {ncrs.map((n) => (
                <tr key={n.id}>
                  <Td>
                    <Link href={`/qc/ncrs/${n.id}`} className="text-indigo-700 hover:underline">
                      {n.ncrNumber}
                    </Link>
                  </Td>
                  <Td className="max-w-[160px] truncate">{n.description}</Td>
                  <Td>
                    <StatusBadge status={n.severity} />
                  </Td>
                  <Td>
                    <StatusBadge status={n.status} />
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
