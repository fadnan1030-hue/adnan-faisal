import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { formatDate, formatHours } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("MAINTENANCE", "read");
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      equipment: true,
      contractor: true,
      pmRecords: true,
      cmRecords: true,
      findings: { orderBy: { date: "desc" } },
      actions: { orderBy: { createdDate: "desc" } },
      photos: true,
    },
  });
  if (!workOrder) notFound();

  const canWrite = can(session.user.role, "MAINTENANCE", "write");

  const fields: [string, string][] = [
    ["Type", workOrder.type],
    ["Work Center", workOrder.workCenter ?? "—"],
    ["Location", workOrder.location ?? "—"],
    ["Priority", workOrder.priority],
    ["Responsible Party", workOrder.responsibleParty ?? "—"],
    ["Contractor", workOrder.contractor?.name ?? "—"],
    ["Planned Start", formatDate(workOrder.plannedStartDate)],
    ["Planned Finish", formatDate(workOrder.plannedFinishDate)],
    ["Actual Start", formatDate(workOrder.actualStartDate)],
    ["Actual Finish", formatDate(workOrder.actualFinishDate)],
    ["Planned Hours", formatHours(workOrder.plannedHours?.toString())],
    ["Actual Hours", formatHours(workOrder.actualHours?.toString())],
  ];

  return (
    <div>
      <PageHeader
        title={`Work Order ${workOrder.workOrderNumber}`}
        description={workOrder.scope ?? workOrder.operationShortText ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={workOrder.status} />
            {canWrite && (
              <Link href={`/work-orders/${id}/edit`} className={buttonSecondaryClass}>
                Edit
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Details</h2>
            <dl className="divide-y divide-line-soft rounded-xl border border-line bg-surface">
              {fields.map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink-strong">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {workOrder.findings.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-ink">Findings</h2>
              <Table>
                <THead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th>Status</Th>
                  </tr>
                </THead>
                <TBody>
                  {workOrder.findings.map((f) => (
                    <tr key={f.id}>
                      <Td>{formatDate(f.date)}</Td>
                      <Td>{f.category}</Td>
                      <Td className="max-w-xs truncate">
                        <Link href={`/findings/${f.id}`} className="text-indigo-700 hover:underline">
                          {f.description}
                        </Link>
                      </Td>
                      <Td><StatusBadge status={f.status} /></Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </section>
          )}

          {workOrder.actions.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-ink">Actions</h2>
              <Table>
                <THead>
                  <tr>
                    <Th>Description</Th>
                    <Th>Target Date</Th>
                    <Th>Status</Th>
                  </tr>
                </THead>
                <TBody>
                  {workOrder.actions.map((a) => (
                    <tr key={a.id}>
                      <Td className="max-w-sm truncate">{a.description}</Td>
                      <Td>{formatDate(a.targetDate)}</Td>
                      <Td><StatusBadge status={a.status} /></Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">Equipment</h3>
            {workOrder.equipment ? (
              <Link
                href={`/equipment/${workOrder.equipment.id}`}
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                {workOrder.equipment.tagNumber}
              </Link>
            ) : (
              <p className="text-sm text-ink-faint">{workOrder.equipmentSortField ?? "Not linked"}</p>
            )}
          </div>

          {(workOrder.pmRecords.length > 0 || workOrder.cmRecords.length > 0) && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-ink">Linked Maintenance Records</h3>
              <ul className="space-y-1 text-sm">
                {workOrder.pmRecords.map((r) => (
                  <li key={r.id}>
                    <Link href={`/pm/${r.id}`} className="text-indigo-700 hover:underline">
                      PM — {formatDate(r.plannedDate)}
                    </Link>
                  </li>
                ))}
                {workOrder.cmRecords.map((r) => (
                  <li key={r.id}>
                    <Link href={`/cm/${r.id}`} className="text-indigo-700 hover:underline">
                      CM — {formatDate(r.breakdownDate)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {workOrder.remarks && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-ink">Remarks</h3>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{workOrder.remarks}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
