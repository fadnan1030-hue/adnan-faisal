import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { Field, inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { updateHseObservation } from "../../actions";

export default async function HseObservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("HSE", "read");
  const { id } = await params;

  const observation = await prisma.hseObservation.findUnique({ where: { id } });
  if (!observation) notFound();

  const canWrite = can(session.user.role, "HSE", "write");

  const fields: [string, string][] = [
    ["Date", formatDate(observation.date)],
    ["Observer", observation.observer ?? "—"],
    ["Area", observation.area ?? "—"],
    ["Equipment Tag", observation.equipmentTag ?? "—"],
    ["Category", observation.category ?? "—"],
    ["Type", observation.isPositive ? "Positive / Good Practice" : "Negative / Unsafe"],
    ["Target Date", formatDate(observation.targetDate)],
    ["Closure Date", formatDate(observation.closureDate)],
  ];

  return (
    <div>
      <PageHeader
        title="HSE Observation"
        description={observation.description}
        actions={<StatusBadge status={observation.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {observation.immediateAction && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Immediate Action</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{observation.immediateAction}</p>
            </div>
          )}
        </div>

        {canWrite && (
          <aside className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Close Out</h3>
            <form action={updateHseObservation} className="space-y-3">
              <input type="hidden" name="id" value={observation.id} />
              <Field label="Corrective Action" htmlFor="correctiveAction">
                <textarea id="correctiveAction" name="correctiveAction" defaultValue={observation.correctiveAction ?? ""} rows={2} className={inputClass} />
              </Field>
              <Field label="Status" htmlFor="status">
                <select id="status" name="status" defaultValue={observation.status} className={inputClass}>
                  {["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION", "CLOSED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Closure Date" htmlFor="closureDate">
                <input type="date" id="closureDate" name="closureDate" defaultValue={observation.closureDate?.toISOString().slice(0, 10) ?? ""} className={inputClass} />
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
