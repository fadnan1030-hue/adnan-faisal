import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { Field, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { updateHseIncident } from "../../actions";

export default async function HseIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("HSE", "read");
  const { id } = await params;

  const incident = await prisma.hseIncident.findUnique({ where: { id }, include: { actions: true } });
  if (!incident) notFound();

  const canWrite = can(session.user.role, "HSE", "write");

  const fields: [string, string][] = [
    ["Type", incident.incidentType.replace(/_/g, " ")],
    ["Date", formatDate(incident.incidentDate)],
    ["Location", incident.location ?? "—"],
    ["Personnel Affected", incident.personnelAffected ?? "—"],
    ["Closure Date", formatDate(incident.closureDate)],
  ];

  return (
    <div>
      <PageHeader
        title="HSE Incident"
        description={incident.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.investigationStatus} />
            <Link
              href={`/actions/new?sourceModule=HSE_INCIDENT&returnTo=/hse/incidents/${id}`}
              className={buttonSecondaryClass}
            >
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
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Investigation</h3>
            <form action={updateHseIncident} className="space-y-3">
              <input type="hidden" name="id" value={incident.id} />
              <Field label="Root Cause" htmlFor="rootCause">
                <textarea id="rootCause" name="rootCause" defaultValue={incident.rootCause ?? ""} rows={2} className={inputClass} />
              </Field>
              <Field label="Corrective Actions" htmlFor="correctiveActions">
                <textarea id="correctiveActions" name="correctiveActions" defaultValue={incident.correctiveActions ?? ""} rows={2} className={inputClass} />
              </Field>
              <Field label="Status" htmlFor="investigationStatus">
                <select id="investigationStatus" name="investigationStatus" defaultValue={incident.investigationStatus} className={inputClass}>
                  {["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Closure Date" htmlFor="closureDate">
                <input type="date" id="closureDate" name="closureDate" defaultValue={incident.closureDate?.toISOString().slice(0, 10) ?? ""} className={inputClass} />
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
