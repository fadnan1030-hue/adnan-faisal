import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatHours } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";

export default async function PmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const { id } = await params;

  const record = await prisma.pmRecord.findUnique({
    where: { id },
    include: {
      equipment: true,
      workOrder: true,
      findings: true,
      photos: true,
      actions: true,
    },
  });
  if (!record) notFound();

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  const fields: [string, string][] = [
    ["Equipment", record.equipment.tagNumber],
    ["PM Type", record.pmType ?? "—"],
    ["PM Frequency", record.pmFrequency ?? "—"],
    ["Planned Date", formatDate(record.plannedDate)],
    ["Actual Start", formatDate(record.actualStart)],
    ["Actual Finish", formatDate(record.actualFinish)],
    ["Planned / Actual Hours", `${formatHours(record.plannedHours?.toString())} / ${formatHours(record.actualHours?.toString())}`],
    ["Responsible Discipline", record.responsibleDiscipline ?? "—"],
    ["Work Center", record.workCenter ?? "—"],
    ["Priority / Criticality", `${record.priority} / ${record.criticality}`],
    ["Work Order", record.workOrder?.workOrderNumber ?? "—"],
  ];

  return (
    <div>
      <PageHeader
        title={`PM — ${record.equipment.tagNumber}`}
        description={formatDate(record.plannedDate)}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            {canWrite && (
              <Link href={`/pm/${id}/edit`} className={buttonSecondaryClass}>
                Edit
              </Link>
            )}
            <Link href={`/findings/new?pmRecordId=${id}&equipmentTag=${record.equipment.tagNumber}`} className={buttonSecondaryClass}>
              + Finding
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <dl className="lg:col-span-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>

        <aside className="space-y-4">
          {record.findingsText && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Findings (free text)</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.findingsText}</p>
            </div>
          )}
          {record.correctiveAction && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Corrective Action</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.correctiveAction}</p>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Linked Records</h3>
            <p className="text-sm text-slate-500">
              {record.findings.length} findings · {record.photos.length} photos · {record.actions.length} actions
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
