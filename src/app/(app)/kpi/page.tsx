import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { can } from "@/lib/rbac";
import { createKpiDefinition, toggleKpiDefinition, saveKpiWeights } from "./actions";
import type { KpiModule } from "@prisma/client";

const MODULES = ["MAINTENANCE", "SCE", "HSE", "QC", "PLANNING"];
const WEIGHT_MODULES: KpiModule[] = ["MAINTENANCE", "HSE", "QC", "PLANNING"];
const FORMULA_TYPES = ["COMPLETION_PCT", "COMPLIANCE_PCT", "VARIANCE", "VARIANCE_PCT", "WEIGHTED_SCORE", "CUSTOM"];

export default async function KpiManagementPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "read");
  const projectId = await getCurrentProjectId();
  const { error } = await searchParams;
  const canWrite = can(session.user.role, "KPI_MANAGEMENT", "write");

  const [definitions, weights] = projectId
    ? await Promise.all([
        prisma.kpiDefinition.findMany({ where: { projectId }, orderBy: [{ module: "asc" }, { name: "asc" }] }),
        prisma.kpiWeight.findMany({ where: { projectId } }),
      ])
    : [[], []];

  const weightByModule = new Map(weights.map((w) => [w.module, w]));
  const totalWeight = weights.reduce((sum, w) => sum + Number(w.weightPct), 0);

  return (
    <div>
      <PageHeader
        title="KPI Management"
        description="Spec sections 25, 55 — centralized KPI definitions and overall category weighting. All dashboard values are computed live; nothing here overrides the transactional data."
      />

      {error && <FormError message={error} />}

      {canWrite && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Overall KPI Weightage</h2>
          <p className="mb-3 text-xs text-slate-500">
            Weights must total 100%. Current total: <strong>{totalWeight}%</strong>
          </p>
          <form action={saveKpiWeights} className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
            {WEIGHT_MODULES.map((m) => (
              <div key={m}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{m}</label>
                <input
                  type="number"
                  step="0.1"
                  name={`weight_${m}`}
                  defaultValue={weightByModule.get(m)?.weightPct.toString() ?? "0"}
                  className={`${inputClass} w-24`}
                />
                <span className="ml-1 text-xs text-slate-400">%</span>
              </div>
            ))}
            <button type="submit" className={buttonPrimaryClass}>
              Save Weights
            </button>
          </form>
        </section>
      )}

      {canWrite && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">New KPI Definition</h2>
          <form action={createKpiDefinition} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <Field label="Name" htmlFor="name" required>
              <input id="name" name="name" required className={inputClass} />
            </Field>
            <Field label="Module" htmlFor="module">
              <select id="module" name="module" defaultValue="MAINTENANCE" className={inputClass}>
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Formula Type" htmlFor="formulaType">
              <select id="formulaType" name="formulaType" defaultValue="COMPLIANCE_PCT" className={inputClass}>
                {FORMULA_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Target" htmlFor="target">
              <input type="number" step="0.1" id="target" name="target" className={inputClass} />
            </Field>
            <Field label="Unit" htmlFor="unit">
              <input id="unit" name="unit" placeholder="%" className={inputClass} />
            </Field>
            <Field label="Weight (within module)" htmlFor="weight">
              <input type="number" step="0.1" id="weight" name="weight" className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Description" htmlFor="description">
                <textarea id="description" name="description" rows={2} className={inputClass} />
              </Field>
            </div>
            <div>
              <button type="submit" className={buttonPrimaryClass}>
                Add KPI Definition
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">KPI Definitions</h2>
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Module</Th>
              <Th>Formula</Th>
              <Th>Target</Th>
              <Th>Weight</Th>
              <Th>Frequency</Th>
              <Th>Status</Th>
              {canWrite && <Th />}
            </tr>
          </THead>
          <TBody>
            {definitions.length === 0 && <EmptyRow colSpan={canWrite ? 8 : 7} />}
            {definitions.map((d) => (
              <tr key={d.id}>
                <Td className="font-medium text-slate-900">{d.name}</Td>
                <Td>{d.module}</Td>
                <Td>{d.formulaType.replace(/_/g, " ")}</Td>
                <Td>{d.target?.toString() ?? "—"}</Td>
                <Td>{d.weight?.toString() ?? "—"}</Td>
                <Td>{d.reportingFrequency}</Td>
                <Td>
                  <StatusBadge status={d.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
                {canWrite && (
                  <Td>
                    <form action={toggleKpiDefinition}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className={buttonSecondaryClass}>
                        {d.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </Td>
                )}
              </tr>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
