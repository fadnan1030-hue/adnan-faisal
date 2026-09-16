import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass, inputClass } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { isOverdue } from "@/lib/overdue";
import { can } from "@/lib/rbac";
import type { TrackerStatus } from "@prisma/client";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const session = await requireModuleAccess("ACTIONS", "read");
  const projectId = await getCurrentProjectId();
  const { status, view } = await searchParams;

  const now = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date();
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [total, open, overdue, dueThisWeek, dueThisMonth, closed] = projectId
    ? await Promise.all([
        prisma.action.count({ where: { projectId } }),
        prisma.action.count({ where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } } }),
        prisma.action.count({
          where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED", "PENDING_VERIFICATION"] }, targetDate: { lt: now } },
        }),
        prisma.action.count({
          where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] }, targetDate: { gte: now, lte: weekEnd } },
        }),
        prisma.action.count({
          where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] }, targetDate: { gte: now, lte: monthEnd } },
        }),
        prisma.action.count({ where: { projectId, status: "CLOSED" } }),
      ])
    : [0, 0, 0, 0, 0, 0];

  const closurePct = total > 0 ? ((closed / total) * 100).toFixed(1) + "%" : "N/A";

  let where: import("@prisma/client").Prisma.ActionWhereInput = {};
  if (view === "overdue") {
    where = { status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED", "PENDING_VERIFICATION"] }, targetDate: { lt: now } };
  } else if (status) {
    where = { status: status as TrackerStatus };
  }

  const actions = projectId
    ? await prisma.action.findMany({
        where: { projectId, ...where },
        include: { equipment: { select: { tagNumber: true } } },
        orderBy: { targetDate: "asc" },
        take: 200,
      })
    : [];

  const canWrite = can(session.user.role, "ACTIONS", "write");

  return (
    <div>
      <PageHeader
        title="Action Tracker"
        description="Every finding, HSE observation, QC finding, NCR and maintenance recommendation can raise an action (spec section 33)."
        actions={
          canWrite && (
            <Link href="/actions/new" className={buttonPrimaryClass}>
              + New Action
            </Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={String(total)} />
        <StatCard label="Open" value={String(open)} href="/actions?status=OPEN" />
        <StatCard label="Overdue" value={String(overdue)} tone={overdue > 0 ? "critical" : "good"} href="/actions?view=overdue" />
        <StatCard label="Due This Week" value={String(dueThisWeek)} tone="warning" />
        <StatCard label="Due This Month" value={String(dueThisMonth)} />
        <StatCard label="Closure %" value={closurePct} tone="good" />
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED", "CANCELLED"].map((s) => (
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
            <Th>Description</Th>
            <Th>Equipment</Th>
            <Th>Source</Th>
            <Th>Responsible</Th>
            <Th>Target Date</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={6} message="Select a project to view actions." />}
          {projectId && actions.length === 0 && <EmptyRow colSpan={6} />}
          {actions.map((a) => (
            <tr key={a.id}>
              <Td className="max-w-sm truncate">
                <Link href={`/actions/${a.id}`} className="text-indigo-700 hover:underline">
                  {a.description}
                </Link>
              </Td>
              <Td>{a.equipment?.tagNumber ?? "—"}</Td>
              <Td>{a.sourceModule.replace(/_/g, " ")}</Td>
              <Td>{a.responsiblePerson ?? "—"}</Td>
              <Td>{formatDate(a.targetDate)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <StatusBadge status={a.status} />
                  {isOverdue(a.targetDate, a.status) && <StatusBadge status="OVERDUE" />}
                </div>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
