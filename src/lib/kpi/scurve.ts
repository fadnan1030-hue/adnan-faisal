import { prisma } from "@/lib/prisma";

export type SCurveGranularity = "daily" | "weekly" | "monthly";

export interface SCurvePoint {
  label: string;
  planned: number;
  completed: number;
}

function bucketEnd(date: Date, granularity: SCurveGranularity): Date {
  const d = new Date(date);
  if (granularity === "daily") {
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (granularity === "weekly") {
    const day = d.getDay();
    const daysToSaturday = 6 - day; // week ends Saturday
    d.setDate(d.getDate() + daysToSaturday);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  // monthly
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function bucketLabel(date: Date, granularity: SCurveGranularity): string {
  if (granularity === "daily") return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  if (granularity === "weekly") return `w/e ${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

const BUCKET_COUNT: Record<SCurveGranularity, number> = { daily: 30, weekly: 12, monthly: 6 };

/** Cumulative planned-vs-completed activity count over time, for the Progress S-curve. */
export async function getSCurveData(projectId: string, granularity: SCurveGranularity): Promise<SCurvePoint[]> {
  const rows = await prisma.workOrder.findMany({
    where: { projectId },
    select: { plannedStartDate: true, actualFinishDate: true, status: true },
  });

  const now = new Date();
  const count = BUCKET_COUNT[granularity];
  const ends: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const ref = new Date(now);
    if (granularity === "daily") ref.setDate(ref.getDate() - i);
    else if (granularity === "weekly") ref.setDate(ref.getDate() - i * 7);
    else ref.setMonth(ref.getMonth() - i);
    ends.push(bucketEnd(ref, granularity));
  }

  return ends.map((end) => {
    const planned = rows.filter((r) => r.plannedStartDate && r.plannedStartDate <= end).length;
    const completed = rows.filter(
      (r) => (r.status === "COMPLETED" || r.status === "CLOSED") && r.actualFinishDate && r.actualFinishDate <= end
    ).length;
    return { label: bucketLabel(end, granularity), planned, completed };
  });
}
