import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatHours } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";

export default async function CmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const { id } = await params;

  const record = await prisma.cmRecord.findUnique({
    where: { id },
    include: { equipment: true, workOrder: true, findings: true, photos: true, actions: true },
  });
  if (!record) notFound();

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  const fields: [string, string][] = [
    ["Equipment", record.equipment.tagNumber],
    ["Breakdown Date", formatDate(record.breakdownDate)],
    ["Notification Date", formatDate(record.notificationDate)],
    ["Priority", record.priority],
    ["Actual Start", formatDate(record.actualStart)],
    ["Actual Finish", formatDate(record.actualFinish)],
    ["Planned / Actual Hours", `${formatHours(record.plannedHours?.toString())} / ${formatHours(record.actualHours?.toString())}`],
    ["Downtime", formatHours(record.downtimeHours?.toString())],
    ["Work Order", record.workOrder?.workOrderNumber ?? "—"],
  ];

  const textFields: [string, string | null][] = [
    ["Failure Description", record.failureDescription],
    ["Problem Statement", record.problemStatement],
    ["Finding", record.finding],
    ["Failure Mode", record.failureMode],
    ["Root Cause", record.rootCause],
    ["Corrective Action", record.correctiveAction],
    ["Spare Parts", record.spareParts],
    ["Production Impact", record.productionImpact],
    ["Recommendation", record.recommendation],
  ];

  return (
    <div>
      <PageHeader
        title={`CM — ${record.equipment.tagNumber}`}
        description={formatDate(record.breakdownDate)}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            {canWrite && (
              <Link href={`/cm/${id}/edit`} className={buttonSecondaryClass}>
                Edit
              </Link>
            )}
            <Link href={`/findings/new?cmRecordId=${id}&equipmentTag=${record.equipment.tagNumber}`} className={buttonSecondaryClass}>
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
          {textFields
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-1 text-sm font-semibold text-slate-700">{label}</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
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
