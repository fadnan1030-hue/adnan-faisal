import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";

export default async function InspectionsPage() {
  const session = await requireModuleAccess("INSPECTIONS", "read");
  const projectId = await getCurrentProjectId();
  const canWrite = can(session.user.role, "INSPECTIONS", "write");

  const inspections = projectId
    ? await prisma.inspection.findMany({
        where: { projectId },
        include: { equipment: { select: { tagNumber: true, id: true } } },
        orderBy: { date: "desc" },
        take: 200,
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="General equipment inspections. SCE tests are recorded under SCE; QC inspections under QC/QA."
        actions={
          canWrite && (
            <Link href="/inspections/new" className={buttonPrimaryClass}>
              + New Inspection
            </Link>
          )
        }
      />

      <Table>
        <THead>
          <tr>
            <Th>Date</Th>
            <Th>Equipment</Th>
            <Th>Type</Th>
            <Th>Inspector</Th>
            <Th>Result</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={5} message="Select a project to view inspections." />}
          {projectId && inspections.length === 0 && <EmptyRow colSpan={5} />}
          {inspections.map((i) => (
            <tr key={i.id}>
              <Td>{formatDate(i.date)}</Td>
              <Td>
                {i.equipment ? (
                  <Link href={`/equipment/${i.equipment.id}`} className="text-blue-700 hover:underline">
                    {i.equipment.tagNumber}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td>{i.type}</Td>
              <Td>{i.inspector ?? "—"}</Td>
              <Td>
                <StatusBadge status={i.result} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
