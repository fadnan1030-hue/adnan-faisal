import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, Field } from "@/components/ui/form";
import { getConfigOptions } from "@/lib/config-options";
import { can } from "@/lib/rbac";
import { recordSceInspection } from "../actions";

export default async function SceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("SCE", "read");
  const { id } = await params;

  const record = await prisma.sceRecord.findUnique({
    where: { id },
    include: { equipment: true, inspections: { orderBy: { date: "desc" } } },
  });
  if (!record) notFound();

  const frequencies = await getConfigOptions(record.projectId, "PM_FREQUENCY");
  const canWrite = can(session.user.role, "SCE", "write");

  const fields: [string, string][] = [
    ["Equipment", record.equipment.tagNumber],
    ["Category", record.sceCategory],
    ["Critical Function", record.criticalFunction ?? "—"],
    ["Test Frequency", record.testFrequency ?? "—"],
    ["Last Test", formatDate(record.lastTestDate)],
    ["Next Due", formatDate(record.nextDueDate)],
    ["Responsible Person", record.responsiblePerson ?? "—"],
  ];

  return (
    <div>
      <PageHeader
        title={`SCE — ${record.equipment.tagNumber}`}
        description={record.sceCategory}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <Link href={`/equipment/${record.equipment.id}`} className={buttonSecondaryClass}>
              View Equipment
            </Link>
            {canWrite && (
              <Link href={`/sce/${id}/edit`} className={buttonSecondaryClass}>
                Edit
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <dl className="divide-y divide-line-soft rounded-xl border border-line bg-surface">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-medium text-ink-strong">{value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Inspection History</h2>
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
                    <Td>
                      <StatusBadge status={i.result} />
                    </Td>
                    <Td>{i.performedBy ?? "—"}</Td>
                    <Td className="max-w-xs truncate">{i.finding ?? "—"}</Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </section>
        </div>

        {canWrite && (
          <aside>
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Record Inspection / Test</h3>
              <form action={recordSceInspection} className="space-y-3">
                <input type="hidden" name="sceRecordId" value={record.id} />
                <Field label="Date" htmlFor="date">
                  <input type="date" id="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
                </Field>
                <Field label="Result" htmlFor="result">
                  <select id="result" name="result" defaultValue="PASS" className={inputClass}>
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                    <option value="CONDITIONAL">Conditional</option>
                  </select>
                </Field>
                <Field label="Test Frequency" htmlFor="testFrequency" hint="Determines the next due date.">
                  <select id="testFrequency" name="testFrequency" defaultValue={record.testFrequency ?? "ANNUAL"} className={inputClass}>
                    {frequencies.map((f) => (
                      <option key={f.id} value={f.code}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Performed By" htmlFor="performedBy">
                  <input id="performedBy" name="performedBy" className={inputClass} />
                </Field>
                <Field label="Finding" htmlFor="finding">
                  <textarea id="finding" name="finding" rows={2} className={inputClass} />
                </Field>
                <button type="submit" className={`${buttonPrimaryClass} w-full`}>
                  Record Inspection
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
