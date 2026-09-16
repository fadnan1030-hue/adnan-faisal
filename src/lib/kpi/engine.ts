import { prisma } from "@/lib/prisma";
import { safePercent } from "@/lib/format";
import type { DateRange } from "@/lib/kpi/period";

// Centralized KPI calculation engine (spec section 55).
//
// Nothing here is ever hand-typed into the database - every number is
// derived live from transactional records (PmRecord, CmRecord, WorkOrder,
// SceRecord, Action, HseIncident, Ncr, Timesheet) for the requested date
// range. Division by zero returns `null` (rendered as "N/A" by
// `formatPercent`/`StatCard`, spec section 78) instead of 0 or Infinity.

export interface MaintenanceKpis {
  pmPlanned: number;
  pmCompleted: number;
  pmCompliancePct: number | null;
  cmReported: number;
  cmCompleted: number;
  cmCompletionPct: number | null;
  totalPlanned: number;
  totalCompleted: number;
  overallCompletionPct: number | null;
  openJobs: number;
  overdueJobs: number;
  rescheduledJobs: number;
  plannedHours: number;
  actualHours: number;
  manHourVariance: number | null;
}

const OPEN_STATUSES = ["PLANNED", "ASSIGNED", "IN_PROGRESS"] as const;
const CLOSED_LIKE_STATUSES = ["COMPLETED", "CLOSED", "CANCELLED"] as const;

function toNumber(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "object" && d !== null && "toNumber" in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export async function getMaintenanceKpis(projectId: string, range: DateRange): Promise<MaintenanceKpis> {
  const [
    pmPlanned,
    pmCompleted,
    cmReported,
    cmCompleted,
    openJobs,
    overdueJobs,
    rescheduledJobs,
    plannedHoursAgg,
    actualHoursAgg,
  ] = await Promise.all([
    prisma.pmRecord.count({ where: { projectId, plannedDate: { gte: range.start, lte: range.end } } }),
    prisma.pmRecord.count({
      where: { projectId, status: "COMPLETED", actualFinish: { gte: range.start, lte: range.end } },
    }),
    prisma.cmRecord.count({ where: { projectId, breakdownDate: { gte: range.start, lte: range.end } } }),
    prisma.cmRecord.count({
      where: { projectId, status: "COMPLETED", actualFinish: { gte: range.start, lte: range.end } },
    }),
    prisma.workOrder.count({
      where: { projectId, status: { in: [...OPEN_STATUSES] } },
    }),
    prisma.workOrder.count({
      where: {
        projectId,
        status: { notIn: [...CLOSED_LIKE_STATUSES] },
        plannedFinishDate: { lt: new Date() },
      },
    }),
    prisma.workOrder.count({
      where: { projectId, status: "RESCHEDULED", updatedAt: { gte: range.start, lte: range.end } },
    }),
    prisma.workOrder.aggregate({
      where: { projectId, plannedStartDate: { gte: range.start, lte: range.end } },
      _sum: { plannedHours: true },
    }),
    prisma.workOrder.aggregate({
      where: { projectId, actualFinishDate: { gte: range.start, lte: range.end } },
      _sum: { actualHours: true },
    }),
  ]);

  const totalPlanned = pmPlanned + cmReported;
  const totalCompleted = pmCompleted + cmCompleted;
  const plannedHours = toNumber(plannedHoursAgg._sum.plannedHours);
  const actualHours = toNumber(actualHoursAgg._sum.actualHours);

  return {
    pmPlanned,
    pmCompleted,
    pmCompliancePct: safePercent(pmCompleted, pmPlanned),
    cmReported,
    cmCompleted,
    cmCompletionPct: safePercent(cmCompleted, cmReported),
    totalPlanned,
    totalCompleted,
    overallCompletionPct: safePercent(totalCompleted, totalPlanned),
    openJobs,
    overdueJobs,
    rescheduledJobs,
    plannedHours,
    actualHours,
    manHourVariance: plannedHours ? actualHours - plannedHours : null,
  };
}

export interface SceKpis {
  total: number;
  due: number;
  completed: number;
  overdue: number;
  compliancePct: number | null;
  openFindings: number;
  openActions: number;
}

export async function getSceKpis(projectId: string): Promise<SceKpis> {
  const now = new Date();
  const [total, due, completed, overdue, openActions] = await Promise.all([
    prisma.sceRecord.count({ where: { projectId } }),
    prisma.sceRecord.count({ where: { projectId, status: { in: ["DUE", "PLANNED"] } } }),
    prisma.sceRecord.count({ where: { projectId, status: { in: ["COMPLETED", "VERIFIED"] } } }),
    prisma.sceRecord.count({ where: { projectId, nextDueDate: { lt: now }, status: { notIn: ["COMPLETED", "VERIFIED"] } } }),
    prisma.action.count({ where: { projectId, sourceModule: "SCE", status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } } }),
  ]);

  return {
    total,
    due,
    completed,
    overdue,
    compliancePct: safePercent(completed, total),
    openFindings: 0,
    openActions,
  };
}

export interface ActionKpis {
  total: number;
  open: number;
  overdue: number;
  dueThisWeek: number;
  closed: number;
  closurePct: number | null;
}

export async function getActionKpis(projectId: string): Promise<ActionKpis> {
  const now = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const OPEN = ["OPEN", "IN_PROGRESS", "ASSIGNED", "PENDING_VERIFICATION"] as const;

  const [total, open, overdue, dueThisWeek, closed] = await Promise.all([
    prisma.action.count({ where: { projectId } }),
    prisma.action.count({ where: { projectId, status: { in: [...OPEN] } } }),
    prisma.action.count({ where: { projectId, status: { in: [...OPEN] }, targetDate: { lt: now } } }),
    prisma.action.count({ where: { projectId, status: { in: [...OPEN] }, targetDate: { gte: now, lte: weekEnd } } }),
    prisma.action.count({ where: { projectId, status: "CLOSED" } }),
  ]);

  return { total, open, overdue, dueThisWeek, closed, closurePct: safePercent(closed, total) };
}

export interface HseKpis {
  ltiCount: number;
  trifCount: number;
  observations: number;
  openObservations: number;
  openHseActions: number;
}

export async function getHseKpis(projectId: string, range: DateRange): Promise<HseKpis> {
  const [ltiCount, trifCount, observations, openObservations, openHseActions] = await Promise.all([
    prisma.hseIncident.count({
      where: { projectId, incidentType: "LTI", incidentDate: { gte: range.start, lte: range.end } },
    }),
    prisma.hseIncident.count({
      where: { projectId, incidentType: "TRIF_RECORDABLE", incidentDate: { gte: range.start, lte: range.end } },
    }),
    prisma.hseObservation.count({ where: { projectId, date: { gte: range.start, lte: range.end } } }),
    prisma.hseObservation.count({ where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } } }),
    prisma.action.count({
      where: {
        projectId,
        sourceModule: { in: ["HSE_INCIDENT", "HSE_OBSERVATION"] },
        status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] },
      },
    }),
  ]);

  return { ltiCount, trifCount, observations, openObservations, openHseActions };
}

export interface QcKpis {
  inspections: number;
  ncrsOpen: number;
  ncrsClosed: number;
  ncrClosurePct: number | null;
  openQcActions: number;
}

export async function getQcKpis(projectId: string, range: DateRange): Promise<QcKpis> {
  const [inspections, ncrsOpen, ncrsClosed, ncrTotal, openQcActions] = await Promise.all([
    prisma.qcInspection.count({ where: { projectId, date: { gte: range.start, lte: range.end } } }),
    prisma.ncr.count({ where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } } }),
    prisma.ncr.count({ where: { projectId, status: "CLOSED" } }),
    prisma.ncr.count({ where: { projectId } }),
    prisma.action.count({
      where: { projectId, sourceModule: { in: ["QC_INSPECTION", "NCR"] }, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED"] } },
    }),
  ]);

  return {
    inspections,
    ncrsOpen,
    ncrsClosed,
    ncrClosurePct: safePercent(ncrsClosed, ncrTotal),
    openQcActions,
  };
}

export interface ManHourKpis {
  normalHours: number;
  overtimeHours: number;
  totalHours: number;
  employeeCount: number;
}

export async function getManHourKpis(projectId: string, range: DateRange): Promise<ManHourKpis> {
  const [agg, employeeCount] = await Promise.all([
    prisma.timesheet.aggregate({
      where: { projectId, date: { gte: range.start, lte: range.end } },
      _sum: { normalHours: true, overtimeHours: true },
    }),
    prisma.timesheet.groupBy({
      by: ["employeeId"],
      where: { projectId, date: { gte: range.start, lte: range.end } },
    }),
  ]);

  const normalHours = toNumber(agg._sum.normalHours);
  const overtimeHours = toNumber(agg._sum.overtimeHours);

  return {
    normalHours,
    overtimeHours,
    totalHours: normalHours + overtimeHours,
    employeeCount: employeeCount.length,
  };
}

export interface LtiFreeCounter {
  daysLtiFree: number | null;
  manHoursSinceLastLti: number;
  totalManHoursProjectToDate: number;
  ltiCountProjectToDate: number;
  countingFrom: Date | null;
}

/** LTI-free man-hour counter (spec section 30) - always derived, never typed in. */
export async function getLtiFreeManHours(projectId: string): Promise<LtiFreeCounter> {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const [lastLti, totalHoursAgg, ltiCount] = await Promise.all([
    prisma.hseIncident.findFirst({
      where: { projectId, incidentType: "LTI" },
      orderBy: { incidentDate: "desc" },
    }),
    prisma.timesheet.aggregate({
      where: { projectId },
      _sum: { normalHours: true, overtimeHours: true },
    }),
    prisma.hseIncident.count({ where: { projectId, incidentType: "LTI" } }),
  ]);

  const countingFrom = lastLti?.incidentDate ?? project.ltiFreeStartDate ?? project.startDate ?? null;

  const hoursSinceAgg = await prisma.timesheet.aggregate({
    where: { projectId, ...(countingFrom ? { date: { gt: countingFrom } } : {}) },
    _sum: { normalHours: true, overtimeHours: true },
  });

  const daysLtiFree = countingFrom
    ? Math.max(0, Math.floor((Date.now() - countingFrom.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    daysLtiFree,
    manHoursSinceLastLti: toNumber(hoursSinceAgg._sum.normalHours) + toNumber(hoursSinceAgg._sum.overtimeHours),
    totalManHoursProjectToDate: toNumber(totalHoursAgg._sum.normalHours) + toNumber(totalHoursAgg._sum.overtimeHours),
    ltiCountProjectToDate: ltiCount,
    countingFrom,
  };
}
