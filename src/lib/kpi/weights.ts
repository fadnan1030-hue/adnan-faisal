import { prisma } from "@/lib/prisma";

// Spec section 25: overall KPI weightage (HSE / QC / Planning / Maintenance)
// must sum to 100%. This is enforced at save time in the KPI Management
// admin screen, not baked into the schema, so partially-configured
// projects don't hard-fail elsewhere.
export async function getKpiWeights(projectId: string) {
  return prisma.kpiWeight.findMany({ where: { projectId, active: true } });
}

export async function totalActiveWeight(projectId: string): Promise<number> {
  const weights = await getKpiWeights(projectId);
  return weights.reduce((sum, w) => sum + Number(w.weightPct), 0);
}

export function computeWeightedScore(compliancePct: number | null, weightPct: number): number | null {
  if (compliancePct === null) return null;
  return (compliancePct / 100) * weightPct;
}
