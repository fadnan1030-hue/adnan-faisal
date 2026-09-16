import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { formatDateTime } from "@/lib/format";
import type { AuditAction, SourceModule } from "@prisma/client";

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>;
}) {
  await requireModuleAccess("AUDIT_TRAIL", "read");
  const projectId = await getCurrentProjectId();
  const { entityType, action } = await searchParams;

  const logs = projectId
    ? await prisma.auditLog.findMany({
        where: {
          projectId,
          ...(entityType ? { entityType: entityType as SourceModule } : {}),
          ...(action ? { action: action as AuditAction } : {}),
        },
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 300,
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Spec section 44 — every create/update/delete/import/export/status-change is logged with actor and before/after values."
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <select name="entityType" defaultValue={entityType ?? ""} className={inputClass}>
          <option value="">All entity types</option>
          {[
            "EQUIPMENT",
            "WORK_ORDER",
            "PM",
            "CM",
            "FINDING",
            "ACTION",
            "SCE",
            "HSE_INCIDENT",
            "HSE_OBSERVATION",
            "QC_INSPECTION",
            "NCR",
            "USER",
            "PROJECT",
          ].map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select name="action" defaultValue={action ?? ""} className={inputClass}>
          <option value="">All actions</option>
          {["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "CLOSURE", "IMPORT", "EXPORT", "PERMISSION_CHANGE"].map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
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
            <Th>Date/Time</Th>
            <Th>Actor</Th>
            <Th>Entity</Th>
            <Th>Action</Th>
          </tr>
        </THead>
        <TBody>
          {logs.length === 0 && <EmptyRow colSpan={4} />}
          {logs.map((l) => (
            <tr key={l.id}>
              <Td>{formatDateTime(l.createdAt)}</Td>
              <Td>{l.actor?.name ?? "System"}</Td>
              <Td>
                {l.entityType.replace(/_/g, " ")} <span className="text-slate-400">({l.entityId.slice(0, 8)})</span>
              </Td>
              <Td>
                <StatusBadge status={l.action} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
