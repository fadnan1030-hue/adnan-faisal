"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str, optStr, optDecimal } from "@/lib/action-helpers";
import type { KpiFormulaType, KpiModule, ReportingFrequency } from "@prisma/client";

export async function createKpiDefinition(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/kpi", "Select a project first.");

  const name = str(formData, "name");
  const kpiModule = str(formData, "module") as KpiModule;
  if (!name || !kpiModule) redirectWithError("/kpi", "Name and module are required.");

  const definition = await prisma.kpiDefinition.create({
    data: {
      projectId,
      name,
      module: kpiModule,
      description: optStr(formData, "description"),
      formulaType: (optStr(formData, "formulaType") as KpiFormulaType) ?? "COMPLIANCE_PCT",
      target: optDecimal(formData, "target"),
      unit: optStr(formData, "unit"),
      weight: optDecimal(formData, "weight"),
      reportingFrequency: (optStr(formData, "reportingFrequency") as ReportingFrequency) ?? "MONTHLY",
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "KPI",
    entityId: definition.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: definition,
  });

  revalidatePath("/kpi");
  redirect("/kpi");
}

export async function toggleKpiDefinition(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const id = str(formData, "id");
  const def = await prisma.kpiDefinition.findUniqueOrThrow({ where: { id } });

  const updated = await prisma.kpiDefinition.update({ where: { id }, data: { active: !def.active } });

  await writeAuditLog({
    projectId: def.projectId,
    entityType: "KPI",
    entityId: def.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: { active: def.active },
    newValue: { active: updated.active },
  });

  revalidatePath("/kpi");
  redirect("/kpi");
}

const WEIGHT_MODULES: KpiModule[] = ["MAINTENANCE", "HSE", "QC", "PLANNING"];

export async function saveKpiWeights(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/kpi", "Select a project first.");

  const weights = WEIGHT_MODULES.map((m) => ({
    module: m,
    weightPct: optDecimal(formData, `weight_${m}`) ?? 0,
  }));

  const total = weights.reduce((sum, w) => sum + w.weightPct, 0);
  if (Math.round(total * 100) / 100 !== 100) {
    redirectWithError("/kpi", `Overall KPI weights must total 100% (currently ${total}%).`);
  }

  for (const w of weights) {
    await prisma.kpiWeight.upsert({
      where: { projectId_module: { projectId: projectId!, module: w.module } },
      update: { weightPct: w.weightPct, active: true },
      create: { projectId: projectId!, module: w.module, weightPct: w.weightPct },
    });
  }

  await writeAuditLog({
    projectId,
    entityType: "KPI",
    entityId: projectId!,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: { weights },
  });

  revalidatePath("/kpi");
  redirect("/kpi");
}
