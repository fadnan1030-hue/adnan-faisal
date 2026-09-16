const OPEN_STATUSES = new Set(["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"]);

/** Overdue is always derived from target date + status, never hand-typed (spec section 84). */
export function isOverdue(targetDate: Date | null | undefined, status: string): boolean {
  if (!targetDate) return false;
  if (!OPEN_STATUSES.has(status)) return false;
  return targetDate.getTime() < Date.now();
}
