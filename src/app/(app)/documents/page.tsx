import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { Field, inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { formatDateTime } from "@/lib/format";
import { can } from "@/lib/rbac";
import { uploadDocument } from "./actions";

const ENTITY_TYPES = ["EQUIPMENT", "WORK_ORDER", "PM", "CM", "FINDING", "ACTION", "SCE", "HSE_INCIDENT", "HSE_OBSERVATION", "QC_INSPECTION", "NCR", "PROJECT"];

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireModuleAccess("DOCUMENTS", "read");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  const canWrite = can(session.user.role, "DOCUMENTS", "write");

  const documents = projectId
    ? await prisma.document.findMany({
        where: { projectId },
        include: { equipment: { select: { tagNumber: true } } },
        orderBy: { uploadedAt: "desc" },
        take: 200,
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Spec section 46 — attachments for equipment, work orders, PM/CM, findings, actions, SCE, HSE and QC records."
      />

      {canWrite && (
        <form action={uploadDocument} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div>
            <Field label="File" htmlFor="file">
              <input type="file" id="file" name="file" required className={inputClass} />
            </Field>
          </div>
          <div>
            <Field label="Linked To" htmlFor="entityType">
              <select id="entityType" name="entityType" defaultValue="EQUIPMENT" className={inputClass}>
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Equipment Tag (optional)" htmlFor="equipmentTag">
              <input id="equipmentTag" name="equipmentTag" className={inputClass} />
            </Field>
          </div>
          <button type="submit" className={buttonPrimaryClass}>
            Upload
          </button>
        </form>
      )}

      <Table>
        <THead>
          <tr>
            <Th>File</Th>
            <Th>Linked To</Th>
            <Th>Equipment</Th>
            <Th>Size</Th>
            <Th>Uploaded</Th>
          </tr>
        </THead>
        <TBody>
          {documents.length === 0 && <EmptyRow colSpan={5} />}
          {documents.map((d) => (
            <tr key={d.id}>
              <Td>
                <a href={d.filePath} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                  {d.fileName}
                </a>
              </Td>
              <Td>{d.entityType.replace(/_/g, " ")}</Td>
              <Td>{d.equipment?.tagNumber ?? "—"}</Td>
              <Td>{(d.fileSize / 1024).toFixed(0)} KB</Td>
              <Td>{formatDateTime(d.uploadedAt)}</Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
