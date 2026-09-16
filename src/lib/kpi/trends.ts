import { getMaintenanceKpis, getManHourKpis } from "@/lib/kpi/engine";
import { resolvePeriod } from "@/lib/kpi/period";

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export async function getMaintenanceTrend(projectId: string, months = 6) {
  const points = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const range = resolvePeriod("MONTHLY", reference);
    const kpis = await getMaintenanceKpis(projectId, range);
    points.push({
      label: monthLabel(reference),
      planned: kpis.totalPlanned,
      completed: kpis.totalCompleted,
      pmPlanned: kpis.pmPlanned,
      pmCompleted: kpis.pmCompleted,
      cmReported: kpis.cmReported,
      cmCompleted: kpis.cmCompleted,
    });
  }

  return points;
}

export async function getManHourTrend(projectId: string, months = 6) {
  const points = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const range = resolvePeriod("MONTHLY", reference);
    const kpis = await getManHourKpis(projectId, range);
    points.push({
      label: monthLabel(reference),
      normal: Math.round(kpis.normalHours),
      overtime: Math.round(kpis.overtimeHours),
      total: Math.round(kpis.totalHours),
    });
  }

  return points;
}
