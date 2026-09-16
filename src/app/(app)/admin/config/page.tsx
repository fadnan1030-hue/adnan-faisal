import Link from "next/link";
import clsx from "clsx";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { CONFIG_CATEGORIES } from "@/lib/config-options";
import { addConfigOption, toggleConfigOption } from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  AREA: "Areas",
  UNIT: "Units",
  DISCIPLINE: "Disciplines",
  WORK_CENTER: "Work Centers",
  EQUIPMENT_TYPE: "Equipment Types",
  PM_FREQUENCY: "PM Frequencies",
  FINDING_CATEGORY: "Finding Categories",
  HSE_OBSERVATION_CATEGORY: "HSE Observation Categories",
  QC_INSPECTION_TYPE: "QC Inspection Types",
  NCR_CATEGORY: "NCR Categories",
};

export default async function ConfigPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireModuleAccess("ADMINISTRATION", "write");
  const projectId = await getCurrentProjectId();
  const { category: categoryParam } = await searchParams;
  const category = CONFIG_CATEGORIES.includes(categoryParam as (typeof CONFIG_CATEGORIES)[number])
    ? categoryParam!
    : CONFIG_CATEGORIES[0];

  const options = projectId
    ? await prisma.configOption.findMany({
        where: { projectId, category },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Configuration"
        description="Configurable lookup lists (spec section 54) — add, edit or disable values without a schema change."
      />

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1 w-fit">
        {CONFIG_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`?category=${c}`}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
              category === c ? "bg-indigo-600 text-white" : "text-ink-soft hover:bg-surface-subtle"
            )}
          >
            {CATEGORY_LABELS[c] ?? c}
          </Link>
        ))}
      </div>

      <form action={addConfigOption} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
        <input type="hidden" name="category" value={category} />
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Code</label>
          <input name="code" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Label</label>
          <input name="label" required className={inputClass} />
        </div>
        <button type="submit" className={buttonPrimaryClass}>
          Add
        </button>
      </form>

      <Table>
        <THead>
          <tr>
            <Th>Code</Th>
            <Th>Label</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </THead>
        <TBody>
          {options.length === 0 && <EmptyRow colSpan={4} />}
          {options.map((o) => (
            <tr key={o.id}>
              <Td className="font-mono text-xs">{o.code}</Td>
              <Td>{o.label}</Td>
              <Td>
                <StatusBadge status={o.active ? "ACTIVE" : "INACTIVE"} />
              </Td>
              <Td>
                <form action={toggleConfigOption}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="category" value={category} />
                  <button type="submit" className={buttonSecondaryClass}>
                    {o.active ? "Disable" : "Enable"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
