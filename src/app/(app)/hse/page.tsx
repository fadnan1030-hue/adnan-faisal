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
import { getHseKpis, getLtiFreeManHours } from "@/lib/kpi/engine";
import { resolvePeriod } from "@/lib/kpi/period";
import { can } from "@/lib/rbac";

export default async function HsePage() {
  const session = await requireModuleAccess("HSE", "read");
  const projectId = await getCurrentProjectId();
  const canWrite = can(session.user.role, "HSE", "write");

  const yearRange = resolvePeriod("YEARLY");

  const [kpis, ltiFree, incidents, observations] = projectId
    ? await Promise.all([
        getHseKpis(projectId, yearRange),
        getLtiFreeManHours(projectId),
        prisma.hseIncident.findMany({ where: { projectId }, orderBy: { incidentDate: "desc" }, take: 10 }),
        prisma.hseObservation.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 10 }),
      ])
    : [null, null, [], []];

  return (
    <div>
      <PageHeader
        title="HSE"
        description="Health, Safety & Environment KPIs, incidents and observations (spec sections 23, 28-30)."
        actions={
          canWrite && (
            <div className="flex gap-2">
              <Link href="/hse/observations/new" className={buttonPrimaryClass}>
                + Observation
              </Link>
              <Link href="/hse/incidents/new" className={buttonPrimaryClass}>
                + Incident
              </Link>
            </div>
          )
        }
      />

      {kpis && ltiFree && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="LTI (YTD)" value={String(kpis.ltiCount)} tone={kpis.ltiCount > 0 ? "critical" : "good"} />
          <StatCard label="TRIF (YTD)" value={String(kpis.trifCount)} tone={kpis.trifCount > 0 ? "warning" : "good"} />
          <StatCard label="Observations (YTD)" value={String(kpis.observations)} />
          <StatCard label="Open Observations" value={String(kpis.openObservations)} tone={kpis.openObservations > 0 ? "warning" : "good"} />
          <StatCard label="Open HSE Actions" value={String(kpis.openHseActions)} />
          <StatCard
            label="Days LTI-Free"
            value={ltiFree.daysLtiFree === null ? "N/A" : String(ltiFree.daysLtiFree)}
            tone="good"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Recent Incidents</h2>
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {incidents.length === 0 && <EmptyRow colSpan={4} />}
              {incidents.map((i) => (
                <tr key={i.id}>
                  <Td>{formatDate(i.incidentDate)}</Td>
                  <Td>{i.incidentType.replace(/_/g, " ")}</Td>
                  <Td className="max-w-[180px] truncate">
                    <Link href={`/hse/incidents/${i.id}`} className="text-indigo-700 hover:underline">
                      {i.description}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={i.investigationStatus} />
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Recent Observations</h2>
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {observations.length === 0 && <EmptyRow colSpan={4} />}
              {observations.map((o) => (
                <tr key={o.id}>
                  <Td>{formatDate(o.date)}</Td>
                  <Td>{o.category ?? "—"}</Td>
                  <Td className="max-w-[180px] truncate">
                    <Link href={`/hse/observations/${o.id}`} className="text-indigo-700 hover:underline">
                      {o.description}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
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
