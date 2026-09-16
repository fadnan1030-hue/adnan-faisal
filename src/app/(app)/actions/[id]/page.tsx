import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { isOverdue } from "@/lib/overdue";
import { can } from "@/lib/rbac";

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("ACTIONS", "read");
  const { id } = await params;

  const record = await prisma.action.findUnique({
    where: { id },
    include: { equipment: true, finding: true, workOrder: true },
  });
  if (!record) notFound();

  const canWrite = can(session.user.role, "ACTIONS", "write");

  const fields: [string, string][] = [
    ["Source", record.sourceModule.replace(/_/g, " ")],
    ["Equipment", record.equipment?.tagNumber ?? "—"],
    ["Responsible Person", record.responsiblePerson ?? "—"],
    ["Priority", record.priority],
    ["Created", formatDateTime(record.createdDate)],
    ["Target Date", formatDate(record.targetDate)],
    ["Closure Date", formatDate(record.closureDate)],
    ["Verified By", record.verifiedBy ?? "—"],
  ];

  return (
    <div>
      <PageHeader
        title="Action"
        description={record.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            {isOverdue(record.targetDate, record.status) && <StatusBadge status="OVERDUE" />}
            {canWrite && (
              <Link href={`/actions/${id}/edit`} className={buttonSecondaryClass}>
                Update / Close
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <dl className="lg:col-span-2 divide-y divide-line-soft rounded-xl border border-line bg-surface">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="font-medium text-ink-strong">{value}</dd>
            </div>
          ))}
        </dl>

        <aside className="space-y-4">
          {record.finding && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-1 text-sm font-semibold text-ink">Source Finding</h3>
              <Link href={`/findings/${record.finding.id}`} className="text-sm text-indigo-700 hover:underline">
                {record.finding.description}
              </Link>
            </div>
          )}
          {record.closureEvidence && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-1 text-sm font-semibold text-ink">Closure Evidence</h3>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{record.closureEvidence}</p>
            </div>
          )}
          {record.remarks && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-1 text-sm font-semibold text-ink">Remarks</h3>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{record.remarks}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
