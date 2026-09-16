import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { Field, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { updateNcr } from "../../actions";

export default async function NcrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("QC", "read");
  const { id } = await params;

  const ncr = await prisma.ncr.findUnique({ where: { id }, include: { actions: true } });
  if (!ncr) notFound();

  const canWrite = can(session.user.role, "QC", "write");

  const fields: [string, string][] = [
    ["Date", formatDate(ncr.date)],
    ["Equipment Tag", ncr.equipmentTag ?? "—"],
    ["Category", ncr.category ?? "—"],
    ["Responsible Person", ncr.responsiblePerson ?? "—"],
    ["Target Date", formatDate(ncr.targetDate)],
    ["Closure Date", formatDate(ncr.closureDate)],
  ];

  return (
    <div>
      <PageHeader
        title={`NCR ${ncr.ncrNumber}`}
        description={ncr.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ncr.severity} />
            <StatusBadge status={ncr.status} />
            <Link href={`/actions/new?sourceModule=NCR&returnTo=/qc/ncrs/${id}`} className={buttonSecondaryClass}>
              + Action
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

        {canWrite && (
          <aside className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Close Out</h3>
            <form action={updateNcr} className="space-y-3">
              <input type="hidden" name="id" value={ncr.id} />
              <Field label="Evidence" htmlFor="evidence">
                <textarea id="evidence" name="evidence" defaultValue={ncr.evidence ?? ""} rows={2} className={inputClass} />
              </Field>
              <Field label="Status" htmlFor="status">
                <select id="status" name="status" defaultValue={ncr.status} className={inputClass}>
                  {["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Closure Date" htmlFor="closureDate">
                <input type="date" id="closureDate" name="closureDate" defaultValue={ncr.closureDate?.toISOString().slice(0, 10) ?? ""} className={inputClass} />
              </Field>
              <button type="submit" className={`${buttonPrimaryClass} w-full`}>
                Save
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
