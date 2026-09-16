import { prisma } from "@/lib/prisma";
import type { DateRange } from "@/lib/kpi/period";

// Contract Annexure-3 weighted KPI formula, ported from the project's prior
// offline dashboard tool: Schedule Compliance (55%) + Quality (20%) +
// HSSE (25%). Unlike the admin-configurable KpiDefinition/KpiWeight system
// elsewhere in this app, these exact weights and score curves are fixed by
// the contract, so they're implemented as plain functions rather than data.
//
// Schedule Compliance is derived live from WorkOrder records (no separate
// daily entry needed); Quality and HSSE can't be tracked per-activity, so
// they come from KpiDailyEntry, saved once per calendar date.

export interface ScheduleParts {
  frozen: number | null;
  pmBacklog: number;
  cmBacklog: number;
  sce: number | null;
}

export interface HseItem {
  description: string;
  weight: number;
  achieved: number;
}

export interface Annexure3Kpi {
  scheduleParts: ScheduleParts;
  schedulePct: number | null;
  qualityParts: { zeroLeakage: number | null; rework: number | null };
  qcPct: number | null;
  hseItems: HseItem[];
  hsePct: number | null;
  overallPct: number | null;
  overallCategoriesUsed: number;
}

function toNumber(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "object" && d !== null && "toNumber" in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export function scoreFrozenSchedule(total: number, completed: number): number | null {
  if (!total) return null;
  const pct = completed / total;
  if (pct < 0.6) return 0;
  if (pct < 0.8) return (0.25 * (pct - 0.6)) / 0.2;
  return 0.25;
}

export function scoreBacklogManWeeks(manWeeks: number, fullAt: number, zeroAt: number): number {
  if (manWeeks <= fullAt) return 0.25;
  if (manWeeks >= zeroAt) return 0;
  return (0.25 * (zeroAt - manWeeks)) / (zeroAt - fullAt);
}

export function scoreSCEProRata(pct: number, max: number): number {
  if (pct >= 1) return max;
  if (pct > 0.9) return (max * (pct - 0.9)) / 0.1;
  return 0;
}

export async function computeScheduleParts(
  projectId: string,
  asOfDate: Date,
  availableMhrsPerWeek: number
): Promise<ScheduleParts> {
  const rowsToDate = { projectId, plannedStartDate: { lte: asOfDate } };
  const completedByDate = {
    status: { in: ["COMPLETED", "CLOSED"] as ("COMPLETED" | "CLOSED")[] },
    actualFinishDate: { lte: asOfDate },
  };

  const [total, completed, pmBacklogAgg, cmBacklogAgg, sceDue, sceDone] = await Promise.all([
    prisma.workOrder.count({ where: rowsToDate }),
    prisma.workOrder.count({ where: { ...rowsToDate, ...completedByDate } }),
    prisma.workOrder.aggregate({
      where: { ...rowsToDate, type: "PM", status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } },
      _sum: { plannedHours: true },
    }),
    prisma.workOrder.aggregate({
      where: { ...rowsToDate, type: "CM", status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } },
      _sum: { plannedHours: true },
    }),
    prisma.workOrder.count({ where: { ...rowsToDate, type: "PM", abcIndicator: "A" } }),
    prisma.workOrder.count({ where: { ...rowsToDate, ...completedByDate, type: "PM", abcIndicator: "A" } }),
  ]);

  const frozen = scoreFrozenSchedule(total, completed);
  const pmBacklogHrs = toNumber(pmBacklogAgg._sum.plannedHours);
  const cmBacklogHrs = toNumber(cmBacklogAgg._sum.plannedHours);
  const pmBacklog = scoreBacklogManWeeks(pmBacklogHrs / availableMhrsPerWeek, 2, 4);
  const cmBacklog = scoreBacklogManWeeks(cmBacklogHrs / availableMhrsPerWeek, 4, 6);
  const sce = sceDue > 0 ? scoreSCEProRata(sceDone / sceDue, 0.25) : null;

  return { frozen, pmBacklog, cmBacklog, sce };
}

export function scheduleScoreFromParts(sp: ScheduleParts): number | null {
  const vals = [sp.frozen, sp.pmBacklog, sp.cmBacklog, sp.sce].filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / (vals.length * 0.25) : null;
}

const HSE_WEIGHTS = {
  lti: 0.15,
  trif: 0.1,
  ptw: 0.15,
  lsrViolations: 0.1,
  otherLsr: 0.05,
  lsrCloseout: 0.1,
  safetyObs: 0.1,
  leadershipWalk: 0.1,
  vehicles: 0.05,
  security: 0.05,
  spills: 0.05,
} as const;

function scoreHseItems(entry: {
  ltiOccurred: boolean;
  trif: number | null;
  ptwPct: number | null;
  lsrViolations: number | null;
  otherLsrPct: number | null;
  lsrCloseoutPct: number | null;
  safetyObsPct: number | null;
  leadershipWalkPct: number | null;
  vehicleIncidents: number | null;
  securityViolations: number | null;
  spills: number | null;
}): HseItem[] {
  const trif = toNumber(entry.trif);
  const trifScore = trif <= 0.5 ? HSE_WEIGHTS.trif : trif > 1.0 ? -0.05 : 0;
  const ptw = toNumber(entry.ptwPct);
  const ptwScore = ptw >= 90 ? 0.15 : ptw > 85 ? 0.12 : ptw > 80 ? 0.08 : 0;
  const lsrV = toNumber(entry.lsrViolations);
  const lsrVScore = lsrV <= 0 ? 0.1 : lsrV === 1 ? 0.08 : lsrV === 2 ? 0.05 : 0;
  const otherLsr = toNumber(entry.otherLsrPct);
  const otherLsrScore = otherLsr >= 100 ? 0.05 : otherLsr >= 90 ? 0.03 : 0;
  const closeout = toNumber(entry.lsrCloseoutPct);
  const closeoutScore = closeout >= 100 ? 0.1 : closeout > 95 ? 0.06 : 0;
  const safetyObs = toNumber(entry.safetyObsPct);
  const safetyObsScore = safetyObs >= 100 ? 0.1 : safetyObs >= 90 ? 0.06 : 0;
  const leadWalk = toNumber(entry.leadershipWalkPct);
  const leadWalkScore = leadWalk >= 100 ? 0.1 : 0;
  const vehicles = toNumber(entry.vehicleIncidents);
  const vehiclesScore = vehicles <= 0 ? 0.05 : vehicles === 1 ? 0.03 : 0;
  const security = toNumber(entry.securityViolations);
  const securityScore = security <= 0 ? 0.05 : security === 1 ? 0.03 : 0;
  const spills = toNumber(entry.spills);
  const spillsScore = spills <= 0 ? 0.05 : spills === 1 ? 0.03 : 0;
  const ltiScore = entry.ltiOccurred ? 0 : HSE_WEIGHTS.lti;

  return [
    { description: "Lost Time Injury", weight: HSE_WEIGHTS.lti, achieved: ltiScore },
    { description: "Total Recordable Injury Frequency", weight: HSE_WEIGHTS.trif, achieved: trifScore },
    { description: "PTW compliance", weight: HSE_WEIGHTS.ptw, achieved: ptwScore },
    { description: "LSR #4, 8, 12 violations", weight: HSE_WEIGHTS.lsrViolations, achieved: lsrVScore },
    { description: "Other LSRs compliance - 10 nos", weight: HSE_WEIGHTS.otherLsr, achieved: otherLsrScore },
    { description: "LSR violations closeout = 100%", weight: HSE_WEIGHTS.lsrCloseout, achieved: closeoutScore },
    { description: "Safety observations CONTRACTORs", weight: HSE_WEIGHTS.safetyObs, achieved: safetyObsScore },
    { description: "Contractor's leadership safety walk", weight: HSE_WEIGHTS.leadershipWalk, achieved: leadWalkScore },
    { description: "Vehicles incidents = 0", weight: HSE_WEIGHTS.vehicles, achieved: vehiclesScore },
    { description: "Security violations = 0", weight: HSE_WEIGHTS.security, achieved: securityScore },
    { description: "Oil/Chemical spill = 0", weight: HSE_WEIGHTS.spills, achieved: spillsScore },
  ];
}

/** Latest saved KpiDailyEntry at or before `date` (Quality/HSSE only apply from the date they're saved onward). */
async function latestEntryAsOf(projectId: string, date: Date) {
  return prisma.kpiDailyEntry.findFirst({
    where: { projectId, date: { lte: date } },
    orderBy: { date: "desc" },
  });
}

export async function getAnnexure3Kpi(projectId: string, date: Date): Promise<Annexure3Kpi> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { availableMhrsPerWeek: true },
  });
  const availableMhrsPerWeek = toNumber(project?.availableMhrsPerWeek) || 240;

  const [scheduleParts, entry] = await Promise.all([
    computeScheduleParts(projectId, date, availableMhrsPerWeek),
    latestEntryAsOf(projectId, date),
  ]);

  const schedulePct = scheduleScoreFromParts(scheduleParts);

  const zeroLeakage = entry?.zeroLeakage != null ? (entry.zeroLeakage ? 1 : 0) : null;
  const rework = entry?.noRework != null ? (entry.noRework ? 1 : 0) : null;
  const qcPct = zeroLeakage !== null && rework !== null ? zeroLeakage * 0.5 + rework * 0.5 : null;

  const hseItems = entry
    ? scoreHseItems({
        ltiOccurred: entry.ltiOccurred,
        trif: entry.trif ? toNumber(entry.trif) : null,
        ptwPct: entry.ptwPct ? toNumber(entry.ptwPct) : null,
        lsrViolations: entry.lsrViolations,
        otherLsrPct: entry.otherLsrPct ? toNumber(entry.otherLsrPct) : null,
        lsrCloseoutPct: entry.lsrCloseoutPct ? toNumber(entry.lsrCloseoutPct) : null,
        safetyObsPct: entry.safetyObsPct ? toNumber(entry.safetyObsPct) : null,
        leadershipWalkPct: entry.leadershipWalkPct ? toNumber(entry.leadershipWalkPct) : null,
        vehicleIncidents: entry.vehicleIncidents,
        securityViolations: entry.securityViolations,
        spills: entry.spills,
      })
    : [];
  const hseTotalWeight = hseItems.reduce((s, i) => s + i.weight, 0);
  const hseTotalAchieved = hseItems.reduce((s, i) => s + i.achieved, 0);
  const hsePct = entry ? (hseTotalWeight > 0 ? hseTotalAchieved / hseTotalWeight : null) : null;

  const weighted: [number, number][] = [
    [schedulePct, 0.55],
    [qcPct, 0.2],
    [hsePct, 0.25],
  ].filter((pair): pair is [number, number] => pair[0] !== null);

  const weightSum = weighted.reduce((s, [, w]) => s + w, 0);
  const overallPct = weighted.length ? weighted.reduce((s, [v, w]) => s + v * w, 0) / weightSum : null;

  return {
    scheduleParts,
    schedulePct,
    qualityParts: { zeroLeakage, rework },
    qcPct,
    hseItems,
    hsePct,
    overallPct,
    overallCategoriesUsed: weighted.length,
  };
}

const WORKING_DAYS = new Set([0, 1, 2, 3, 4]); // Sunday-Thursday

export async function getRosterManHours(projectId: string, range: DateRange) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      availableMhrsPerWeek: true,
      rosterDirectQty: true,
      rosterIndirectQty: true,
      rosterStandardHours: true,
    },
  });

  const availableMhrsPerWeek = toNumber(project?.availableMhrsPerWeek) || 240;
  const directQty = project?.rosterDirectQty ?? 0;
  const indirectQty = project?.rosterIndirectQty ?? 0;
  const standardHours = toNumber(project?.rosterStandardHours) || 8;

  let workingDays = 0;
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  while (cursor <= end) {
    if (WORKING_DAYS.has(cursor.getDay())) workingDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  const standardMH = workingDays * (directQty + indirectQty) * standardHours;

  const emergencyAgg = await prisma.kpiDailyEntry.aggregate({
    where: { projectId, date: { gte: range.start, lte: range.end } },
    _sum: { directEmergencyMH: true, indirectEmergencyMH: true },
  });
  const emergencyMH = toNumber(emergencyAgg._sum.directEmergencyMH) + toNumber(emergencyAgg._sum.indirectEmergencyMH);

  const days = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const availableMH = availableMhrsPerWeek * (days / 7);

  return {
    availableMH,
    actualMH: standardMH + emergencyMH,
    standardMH,
    emergencyMH,
    workingDays,
  };
}
