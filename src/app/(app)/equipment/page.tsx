import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass, inputClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; criticality?: string; sce?: string }>;
}) {
  const session = await requireModuleAccess("EQUIPMENT", "read");
  const projectId = await getCurrentProjectId();
  const { q, criticality, sce } = await searchParams;

  const equipment = projectId
    ? await prisma.equipment.findMany({
        where: {
          projectId,
          active: true,
          ...(q
            ? {
                OR: [
                  { tagNumber: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(criticality ? { criticality: criticality as never } : {}),
          ...(sce === "yes" ? { isSce: true } : {}),
        },
        orderBy: { tagNumber: "asc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "EQUIPMENT", "write");

  return (
    <div>
      <PageHeader
        title="Equipment Master"
        description="Equipment tag number is the central relational key — every PM, CM, finding, photo and action traces back here (spec section 17)."
        actions={
          canWrite && (
            <Link href="/equipment/new" className={buttonPrimaryClass}>
              + New Equipment
            </Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search tag or description, e.g. 715CX or PSV"
          className={`${inputClass} max-w-xs`}
        />
        <select name="criticality" defaultValue={criticality ?? ""} className={inputClass}>
          <option value="">All criticality</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select name="sce" defaultValue={sce ?? ""} className={inputClass}>
          <option value="">All equipment</option>
          <option value="yes">SCE only</option>
        </select>
        <button type="submit" className={buttonPrimaryClass}>
          Filter
        </button>
      </form>

      <Table>
        <THead>
          <tr>
            <Th>Tag Number</Th>
            <Th>Description</Th>
            <Th>Area / Unit</Th>
            <Th>Type</Th>
            <Th>Criticality</Th>
            <Th>SCE</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={7} message="Select a project to view equipment." />}
          {projectId && equipment.length === 0 && <EmptyRow colSpan={7} />}
          {equipment.map((e) => (
            <tr key={e.id} className="cursor-pointer hover:bg-slate-50">
              <Td>
                <Link href={`/equipment/${e.id}`} className="font-medium text-blue-700 hover:underline">
                  {e.tagNumber}
                </Link>
              </Td>
              <Td>{e.description}</Td>
              <Td>
                {[e.area, e.unit].filter(Boolean).join(" / ") || "—"}
              </Td>
              <Td>{e.equipmentType ?? "—"}</Td>
              <Td>
                <StatusBadge status={e.criticality} />
              </Td>
              <Td>{e.isSce ? <StatusBadge status="ACTIVE" /> : "—"}</Td>
              <Td>
                <StatusBadge status={e.operationalStatus} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
      {equipment.length === 200 && (
        <p className="mt-2 text-xs text-slate-400">Showing first 200 results — refine your search.</p>
      )}
    </div>
  );
}
