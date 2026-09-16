export type PeriodType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Resolve a KPI reporting period into a concrete [start, end] date range. */
export function resolvePeriod(
  type: PeriodType,
  reference: Date = new Date(),
  custom?: { start?: string; end?: string }
): DateRange {
  if (type === "CUSTOM") {
    const start = custom?.start ? startOfDay(new Date(custom.start)) : startOfDay(new Date(0));
    const end = custom?.end ? endOfDay(new Date(custom.end)) : endOfDay(reference);
    return { start, end };
  }

  if (type === "DAILY") {
    return { start: startOfDay(reference), end: endOfDay(reference) };
  }

  if (type === "WEEKLY") {
    const day = reference.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = startOfDay(new Date(reference));
    start.setDate(start.getDate() - diffToMonday);
    const end = endOfDay(new Date(start));
    end.setDate(end.getDate() + 6);
    return { start, end };
  }

  if (type === "MONTHLY") {
    const start = startOfDay(new Date(reference.getFullYear(), reference.getMonth(), 1));
    const end = endOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
    return { start, end };
  }

  // YEARLY
  const start = startOfDay(new Date(reference.getFullYear(), 0, 1));
  const end = endOfDay(new Date(reference.getFullYear(), 11, 31));
  return { start, end };
}

export const PERIOD_LABELS: Record<PeriodType, string> = {
  DAILY: "Today",
  WEEKLY: "This Week",
  MONTHLY: "This Month",
  YEARLY: "This Year (YTD)",
  CUSTOM: "Custom Range",
};
