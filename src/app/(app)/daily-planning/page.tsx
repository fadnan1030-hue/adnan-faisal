import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatHours } from "@/lib/format";
import { inputClass, buttonPrimaryClass } from "@/components/ui/form";
import clsx from "clsx";

type ViewKey = "today" | "tomorrow" | "overdue" | "week" | "custom";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "today", label: "Today's Jobs" },
  { key: "tomorrow", label: "Tomorrow's Jobs" },
  { key: "overdue", label: "Overdue Jobs" },
  { key: "week", label: "This Week" },
  { key: "custom", label: "Custom Date" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default async function DailyPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  await requireModuleAccess("DAILY_PLANNING", "read");
  const projectId = await getCurrentProjectId();
  const { view: viewParam, date } = await searchParams;
  const view: ViewKey = (VIEWS.find((v) => v.key === viewParam)?.key ?? "today") as ViewKey;

  const now = new Date();
  let where: import("@prisma/client").Prisma.WorkOrderWhereInput = {};

  if (view === "today") {
    where = { plannedFinishDate: { gte: startOfDay(now), lte: endOfDay(now) } };
  } else if (view === "tomorrow") {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    where = { plannedFinishDate: { gte: startOfDay(t), lte: endOfDay(t) } };
  } else if (view === "overdue") {
    // Matches the dashboard's "Overdue Jobs" KPI exactly (spec section 84 -
    // overdue is always derived from status + the current instant, never
    // hand-typed or day-rounded, so the drill-down count matches the card).
    where = { plannedFinishDate: { lt: now }, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } };
  } else if (view === "week") {
    const start = startOfDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    where = { plannedFinishDate: { gte: start, lte: end } };
  } else if (view === "custom" && date) {
    const d = new Date(date);
    where = { plannedFinishDate: { gte: startOfDay(d), lte: endOfDay(d) } };
  }

  const jobs = projectId
    ? await prisma.workOrder.findMany({
        where: { projectId, ...where },
        include: { equipment: { select: { tagNumber: true } } },
        orderBy: { plannedFinishDate: "asc" },
        take: 300,
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Daily Planning"
        description="Today / tomorrow / overdue / weekly job views, equivalent to the Excel “Today Jobs” report (spec sections 15-16)."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`?view=${v.key}`}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                view === v.key ? "bg-indigo-600 text-white" : "text-ink-soft hover:bg-surface-subtle"
              )}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        {view === "custom" && (
          <form className="flex gap-2">
            <input type="hidden" name="view" value="custom" />
            <input type="date" name="date" defaultValue={date} className={inputClass} />
            <button type="submit" className={buttonPrimaryClass}>
              Go
            </button>
          </form>
        )}
      </div>

      <Table>
        <THead>
          <tr>
            <Th>Work Center</Th>
            <Th>Operation</Th>
            <Th>Equipment</Th>
            <Th>Scope</Th>
            <Th>Earliest Finish</Th>
            <Th>Actual Start / Finish</Th>
            <Th>Planned / Actual Hrs</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <TBody>
          {!projectId && <EmptyRow colSpan={8} message="Select a project to view daily planning." />}
          {projectId && jobs.length === 0 && <EmptyRow colSpan={8} />}
          {jobs.map((j) => (
            <tr key={j.id}>
              <Td>{j.workCenter ?? "—"}</Td>
              <Td className="max-w-xs truncate">
                <Link href={`/work-orders/${j.id}`} className="text-indigo-700 hover:underline">
                  {j.operationShortText ?? j.workOrderNumber}
                </Link>
              </Td>
              <Td>{j.equipment?.tagNumber ?? j.equipmentSortField ?? "—"}</Td>
              <Td className="max-w-xs truncate">{j.scope ?? "—"}</Td>
              <Td>{formatDate(j.earliestFinishDate ?? j.plannedFinishDate)}</Td>
              <Td>
                {formatDate(j.actualStartDate)} / {formatDate(j.actualFinishDate)}
              </Td>
              <Td>
                {formatHours(j.plannedHours?.toString())} / {formatHours(j.actualHours?.toString())}
              </Td>
              <Td>
                <StatusBadge status={j.status} />
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
