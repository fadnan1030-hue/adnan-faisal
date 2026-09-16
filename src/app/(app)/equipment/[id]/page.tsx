import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatHours } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { RangeSelector } from "@/components/ui/range-selector";
import { can } from "@/lib/rbac";

const TABS = [
  "overview",
  "timeline",
  "pm",
  "cm",
  "inspections",
  "findings",
  "photos",
  "documents",
  "sce",
  "workorders",
] as const;
type Tab = (typeof TABS)[number];

const RANGE_OPTIONS: Record<string, number | null> = {
  "30": 30,
  "90": 90,
  "365": 365,
  all: null,
};

function rangeStart(range: string | undefined): Date | undefined {
  const days = RANGE_OPTIONS[range ?? "all"];
  if (days === null || days === undefined) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default async function EquipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const session = await requireModuleAccess("EQUIPMENT", "read");
  const { id } = await params;
  const { tab: tabParam, range } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "overview";
  const since = rangeStart(range);

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: { sceRecord: true },
  });
  if (!equipment) notFound();

  const [pmCount, cmCount, findingCount, photoCount, openActionCount] = await Promise.all([
    prisma.pmRecord.count({ where: { equipmentId: id } }),
    prisma.cmRecord.count({ where: { equipmentId: id } }),
    prisma.finding.count({ where: { equipmentId: id } }),
    prisma.photo.count({ where: { equipmentId: id } }),
    prisma.action.count({ where: { equipmentId: id, status: { in: ["OPEN", "IN_PROGRESS", "OVERDUE"] } } }),
  ]);

  const canWrite = can(session.user.role, "EQUIPMENT", "write");
  const qs = (t: Tab) => `?tab=${t}${range ? `&range=${range}` : ""}`;

  return (
    <div>
      <PageHeader
        title={equipment.tagNumber}
        description={equipment.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={equipment.operationalStatus} />
            {equipment.isSce && <StatusBadge status="ACTIVE" />}
            {canWrite && (
              <Link href={`/equipment/${id}/edit`} className={buttonSecondaryClass}>
                Edit
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <MiniStat label="Criticality" value={equipment.criticality} />
        <MiniStat label="Area / Unit" value={[equipment.area, equipment.unit].filter(Boolean).join(" / ") || "—"} />
        <MiniStat label="PM Records" value={String(pmCount)} />
        <MiniStat label="CM Records" value={String(cmCount)} />
        <MiniStat label="Findings" value={String(findingCount)} />
        <MiniStat label="Open Actions" value={String(openActionCount)} tone={openActionCount > 0 ? "warning" : undefined} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <nav className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Link
              key={t}
              href={qs(t)}
              className={clsx(
                "rounded-t-md px-3 py-2 text-sm font-medium capitalize",
                tab === t
                  ? "border-b-2 border-blue-600 text-blue-700"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t === "workorders" ? "Work Orders" : t}
            </Link>
          ))}
        </nav>
        {tab !== "overview" && tab !== "sce" && <RangeSelector tab={tab} range={range} />}
      </div>

      {tab === "overview" && <OverviewTab equipment={equipment} photoCount={photoCount} />}
      {tab === "timeline" && <TimelineTab equipmentId={id} since={since} />}
      {tab === "pm" && <PmTab equipmentId={id} since={since} />}
      {tab === "cm" && <CmTab equipmentId={id} since={since} />}
      {tab === "inspections" && <InspectionsTab equipmentId={id} since={since} />}
      {tab === "findings" && <FindingsTab equipmentId={id} since={since} />}
      {tab === "photos" && <PhotosTab equipmentId={id} />}
      {tab === "documents" && <DocumentsTab equipmentId={id} />}
      {tab === "sce" && <SceTab equipment={equipment} />}
      {tab === "workorders" && <WorkOrdersTab equipmentId={id} since={since} />}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={clsx("mt-1 text-lg font-semibold", tone === "warning" ? "text-amber-600" : "text-slate-900")}>
        {value}
      </p>
    </div>
  );
}

async function OverviewTab({
  equipment,
  photoCount,
}: {
  equipment: NonNullable<Awaited<ReturnType<typeof prisma.equipment.findUnique>>>;
  photoCount: number;
}) {
  const rows: [string, string][] = [
    ["Equipment Type", equipment.equipmentType ?? "—"],
    ["Equipment Category", equipment.equipmentCategory ?? "—"],
    ["System / Subsystem", [equipment.system, equipment.subsystem].filter(Boolean).join(" / ") || "—"],
    ["Manufacturer / Model", [equipment.manufacturer, equipment.model].filter(Boolean).join(" / ") || "—"],
    ["Serial Number", equipment.serialNumber ?? "—"],
    ["ABC Indicator", equipment.abcIndicator ?? "—"],
    ["Discipline", equipment.discipline ?? "—"],
    ["Responsible Team", equipment.responsibleTeam ?? "—"],
    ["Maintenance Strategy", equipment.maintenanceStrategy ?? "—"],
    ["PM Frequency", equipment.pmFrequency ?? "—"],
    ["Installation Date", formatDate(equipment.installationDate)],
    ["Commissioning Date", formatDate(equipment.commissioningDate)],
    ["Photos on File", String(photoCount)],
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      {equipment.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{equipment.notes}</p>
        </div>
      )}
    </div>
  );
}

async function TimelineTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const events = await prisma.equipmentHistoryEvent.findMany({
    where: { equipmentId, ...(since ? { eventDate: { gte: since } } : {}) },
    orderBy: { eventDate: "desc" },
    take: 200,
  });

  if (events.length === 0) return <EmptyState message="No history events recorded for this range." />;

  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">{e.title}</span>
            <span className="text-xs text-slate-400">{formatDate(e.eventDate)}</span>
          </div>
          {e.summary && <p className="mt-1 text-sm text-slate-500">{e.summary}</p>}
          <span className="mt-1 inline-block text-[11px] uppercase tracking-wide text-slate-400">
            {e.eventType.replace(/_/g, " ")}
          </span>
        </li>
      ))}
    </ol>
  );
}

async function PmTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const records = await prisma.pmRecord.findMany({
    where: { equipmentId, ...(since ? { plannedDate: { gte: since } } : {}) },
    orderBy: { plannedDate: "desc" },
    take: 100,
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>Planned Date</Th>
          <Th>PM Type</Th>
          <Th>Status</Th>
          <Th>Planned / Actual Hours</Th>
          <Th>Findings</Th>
        </tr>
      </THead>
      <TBody>
        {records.length === 0 && <EmptyRow colSpan={5} />}
        {records.map((r) => (
          <tr key={r.id}>
            <Td>
              <Link href={`/pm/${r.id}`} className="text-blue-700 hover:underline">
                {formatDate(r.plannedDate)}
              </Link>
            </Td>
            <Td>{r.pmType ?? "—"}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <Td>{formatHours(r.plannedHours?.toString())} / {formatHours(r.actualHours?.toString())}</Td>
            <Td className="max-w-xs truncate">{r.findingsText ?? "—"}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

async function CmTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const records = await prisma.cmRecord.findMany({
    where: { equipmentId, ...(since ? { breakdownDate: { gte: since } } : {}) },
    orderBy: { breakdownDate: "desc" },
    take: 100,
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>Breakdown Date</Th>
          <Th>Failure Description</Th>
          <Th>Root Cause</Th>
          <Th>Status</Th>
          <Th>Downtime</Th>
        </tr>
      </THead>
      <TBody>
        {records.length === 0 && <EmptyRow colSpan={5} />}
        {records.map((r) => (
          <tr key={r.id}>
            <Td>
              <Link href={`/cm/${r.id}`} className="text-blue-700 hover:underline">
                {formatDate(r.breakdownDate)}
              </Link>
            </Td>
            <Td className="max-w-xs truncate">{r.failureDescription ?? "—"}</Td>
            <Td className="max-w-xs truncate">{r.rootCause ?? "—"}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <Td>{formatHours(r.downtimeHours?.toString())}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

async function InspectionsTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const records = await prisma.inspection.findMany({
    where: { equipmentId, ...(since ? { date: { gte: since } } : {}) },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>Date</Th>
          <Th>Type</Th>
          <Th>Inspector</Th>
          <Th>Result</Th>
          <Th>Remarks</Th>
        </tr>
      </THead>
      <TBody>
        {records.length === 0 && <EmptyRow colSpan={5} />}
        {records.map((r) => (
          <tr key={r.id}>
            <Td>{formatDate(r.date)}</Td>
            <Td>{r.type}</Td>
            <Td>{r.inspector ?? "—"}</Td>
            <Td><StatusBadge status={r.result} /></Td>
            <Td className="max-w-xs truncate">{r.remarks ?? "—"}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

async function FindingsTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const records = await prisma.finding.findMany({
    where: { equipmentId, ...(since ? { date: { gte: since } } : {}) },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>Date</Th>
          <Th>Category</Th>
          <Th>Description</Th>
          <Th>Severity</Th>
          <Th>Status</Th>
        </tr>
      </THead>
      <TBody>
        {records.length === 0 && <EmptyRow colSpan={5} />}
        {records.map((r) => (
          <tr key={r.id}>
            <Td>{formatDate(r.date)}</Td>
            <Td>{r.category}</Td>
            <Td className="max-w-sm truncate">
              <Link href={`/findings/${r.id}`} className="text-blue-700 hover:underline">
                {r.description}
              </Link>
            </Td>
            <Td><StatusBadge status={r.severity} /></Td>
            <Td><StatusBadge status={r.status} /></Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

async function PhotosTab({ equipmentId }: { equipmentId: string }) {
  const photos = await prisma.photo.findMany({
    where: { equipmentId },
    orderBy: { takenAt: "desc" },
    take: 100,
  });

  if (photos.length === 0) return <EmptyState message="No photographs uploaded for this equipment yet." />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {photos.map((p) => (
        <a key={p.id} href={p.filePath} target="_blank" rel="noreferrer" className="group block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.thumbnailPath ?? p.filePath}
            alt={p.caption ?? p.category}
            className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
          />
          <p className="mt-1 truncate text-xs text-slate-500">{p.caption ?? p.category}</p>
          <p className="text-[11px] text-slate-400">{formatDate(p.takenAt)}</p>
        </a>
      ))}
    </div>
  );
}

async function DocumentsTab({ equipmentId }: { equipmentId: string }) {
  const documents = await prisma.document.findMany({
    where: { equipmentId },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>File</Th>
          <Th>Type</Th>
          <Th>Size</Th>
          <Th>Uploaded</Th>
        </tr>
      </THead>
      <TBody>
        {documents.length === 0 && <EmptyRow colSpan={4} />}
        {documents.map((d) => (
          <tr key={d.id}>
            <Td>
              <a href={d.filePath} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                {d.fileName}
              </a>
            </Td>
            <Td>{d.fileType}</Td>
            <Td>{(d.fileSize / 1024).toFixed(0)} KB</Td>
            <Td>{formatDateTime(d.uploadedAt)}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

async function SceTab({
  equipment,
}: {
  equipment: NonNullable<Awaited<ReturnType<typeof prisma.equipment.findUnique>>> & {
    sceRecord: Awaited<ReturnType<typeof prisma.sceRecord.findUnique>>;
  };
}) {
  if (!equipment.isSce || !equipment.sceRecord) {
    return <EmptyState message="This equipment is not registered as Safety Critical Equipment." />;
  }

  const record = await prisma.sceRecord.findUnique({
    where: { id: equipment.sceRecord.id },
    include: { inspections: { orderBy: { date: "desc" } } },
  });
  if (!record) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Category" value={record.sceCategory} />
        <MiniStat label="Status" value={record.status} />
        <MiniStat label="Last Test" value={formatDate(record.lastTestDate)} />
        <MiniStat label="Next Due" value={formatDate(record.nextDueDate)} />
      </div>
      <Table>
        <THead>
          <tr>
            <Th>Date</Th>
            <Th>Result</Th>
            <Th>Performed By</Th>
            <Th>Finding</Th>
          </tr>
        </THead>
        <TBody>
          {record.inspections.length === 0 && <EmptyRow colSpan={4} />}
          {record.inspections.map((i) => (
            <tr key={i.id}>
              <Td>{formatDate(i.date)}</Td>
              <Td><StatusBadge status={i.result} /></Td>
              <Td>{i.performedBy ?? "—"}</Td>
              <Td className="max-w-xs truncate">{i.finding ?? "—"}</Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

async function WorkOrdersTab({ equipmentId, since }: { equipmentId: string; since?: Date }) {
  const orders = await prisma.workOrder.findMany({
    where: { equipmentId, ...(since ? { createdAt: { gte: since } } : {}) },
    orderBy: { plannedStartDate: "desc" },
    take: 100,
  });

  return (
    <Table>
      <THead>
        <tr>
          <Th>WO #</Th>
          <Th>Type</Th>
          <Th>Scope</Th>
          <Th>Planned Start</Th>
          <Th>Status</Th>
        </tr>
      </THead>
      <TBody>
        {orders.length === 0 && <EmptyRow colSpan={5} />}
        {orders.map((o) => (
          <tr key={o.id}>
            <Td>
              <Link href={`/work-orders/${o.id}`} className="text-blue-700 hover:underline">
                {o.workOrderNumber}
              </Link>
            </Td>
            <Td>{o.type}</Td>
            <Td className="max-w-xs truncate">{o.scope ?? o.operationShortText ?? "—"}</Td>
            <Td>{formatDate(o.plannedStartDate)}</Td>
            <Td><StatusBadge status={o.status} /></Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
