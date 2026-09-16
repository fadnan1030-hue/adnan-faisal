import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass, inputClass } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import type { TrackerStatus, FindingSeverity } from "@prisma/client";

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string; category?: string }>;
}) {
  const session = await requireModuleAccess("FINDINGS", "read");
  const projectId = await getCurrentProjectId();
  const { status, severity, category } = await searchParams;

  const findings = projectId
    ? await prisma.finding.findMany({
        where: {
          projectId,
          ...(status ? { status: status as TrackerStatus } : {}),
          ...(severity ? { severity: severity as FindingSeverity } : {}),
          ...(category ? { category } : {}),
        },
        include: { equipment: { select: { tagNumber: true, id: true } } },
        orderBy: { date: "desc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "FINDINGS", "write");

  return (
    <div>
      <PageHeader
        title="Findings"
        description="Spec section 19 — every finding is traceable Equipment → Work Order → Activity → Finding → Photograph → Action → Closure."
        actions={
          canWrite && (
            <Link href="/findings/new" className={buttonPrimaryClass}>
              + New Finding
            </Link>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED", "OVERDUE", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="severity" defaultValue={severity ?? ""} className={inputClass}>
          <option value="">All severities</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
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
            <Th>Date</Th>
            <Th>Equipment</Th>
            <Th>Category</Th>
            <Th>Description</Th>
            <Th>Severity</Th>
            <Th>Target Date</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={7} message="Select a project to view findings." />}
          {projectId && findings.length === 0 && <EmptyRow colSpan={7} />}
          {findings.map((f) => (
            <tr key={f.id}>
              <Td>{formatDate(f.date)}</Td>
              <Td>{f.equipment?.tagNumber ?? "—"}</Td>
              <Td>{f.category}</Td>
              <Td className="max-w-sm truncate">
                <Link href={`/findings/${f.id}`} className="text-indigo-700 hover:underline">
                  {f.description}
                </Link>
              </Td>
              <Td>
                <StatusBadge status={f.severity} />
              </Td>
              <Td>{formatDate(f.targetDate)}</Td>
              <Td>
                <StatusBadge status={f.status} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
