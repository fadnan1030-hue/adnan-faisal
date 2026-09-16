import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { buttonSecondaryClass, buttonPrimaryClass, inputClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { uploadFindingPhotos } from "../actions";

const PHOTO_CATEGORIES = ["BEFORE", "DURING", "DEFECT", "FINDING", "REPAIR", "AFTER", "NAMEPLATE", "GENERAL", "OTHER"];

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireModuleAccess("FINDINGS", "read");
  const { id } = await params;

  const finding = await prisma.finding.findUnique({
    where: { id },
    include: { equipment: true, workOrder: true, photos: { orderBy: { takenAt: "desc" } }, actions: true },
  });
  if (!finding) notFound();

  const canWrite = can(session.user.role, "FINDINGS", "write");

  const fields: [string, string][] = [
    ["Equipment", finding.equipment?.tagNumber ?? "—"],
    ["Date", formatDate(finding.date)],
    ["Category", finding.category],
    ["Work Order", finding.workOrder?.workOrderNumber ?? "—"],
    ["Responsible Person", finding.responsiblePerson ?? "—"],
    ["Target Date", formatDate(finding.targetDate)],
    ["Closure Date", formatDate(finding.closureDate)],
    ["Verified By", finding.verifiedBy ?? "—"],
  ];

  return (
    <div>
      <PageHeader
        title="Finding"
        description={finding.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={finding.severity} />
            <StatusBadge status={finding.status} />
            {canWrite && (
              <>
                <Link href={`/findings/${id}/edit`} className={buttonSecondaryClass}>
                  Update / Close
                </Link>
                <Link
                  href={`/actions/new?findingId=${id}&equipmentTag=${finding.equipment?.tagNumber ?? ""}&sourceModule=FINDING&returnTo=/findings/${id}`}
                  className={buttonSecondaryClass}
                >
                  + Action
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>

          {(finding.immediateAction || finding.recommendedAction) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {finding.immediateAction && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-1 text-sm font-semibold text-slate-700">Immediate Action</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{finding.immediateAction}</p>
                </div>
              )}
              {finding.recommendedAction && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-1 text-sm font-semibold text-slate-700">Recommended Action</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{finding.recommendedAction}</p>
                </div>
              )}
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Photographs ({finding.photos.length})</h2>
            {finding.photos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-400">
                No photographs attached yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {finding.photos.map((p) => (
                  <a key={p.id} href={p.filePath} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.filePath} alt={p.caption ?? p.category} className="aspect-square w-full rounded-lg border border-slate-200 object-cover" />
                    <p className="mt-1 truncate text-xs text-slate-500">{p.category}</p>
                  </a>
                ))}
              </div>
            )}

            {canWrite && (
              <form action={uploadFindingPhotos} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="findingId" value={finding.id} />
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Add Photos</label>
                  <input type="file" name="photos" accept="image/*" multiple className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                  <select name="category" defaultValue="FINDING" className={inputClass}>
                    {PHOTO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Caption</label>
                  <input type="text" name="caption" className={inputClass} />
                </div>
                <button type="submit" className={buttonPrimaryClass}>
                  Upload
                </button>
              </form>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {finding.equipment && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Equipment</h3>
              <Link href={`/equipment/${finding.equipment.id}`} className="text-sm text-blue-700 hover:underline">
                {finding.equipment.tagNumber}
              </Link>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Linked Actions ({finding.actions.length})</h3>
            <ul className="space-y-1 text-sm">
              {finding.actions.map((a) => (
                <li key={a.id}>
                  <Link href={`/actions/${a.id}`} className="text-blue-700 hover:underline">
                    {a.description}
                  </Link>{" "}
                  <StatusBadge status={a.status} />
                </li>
              ))}
              {finding.actions.length === 0 && <li className="text-slate-400">No actions raised yet.</li>}
            </ul>
          </div>
          {finding.remarks && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Remarks</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{finding.remarks}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
