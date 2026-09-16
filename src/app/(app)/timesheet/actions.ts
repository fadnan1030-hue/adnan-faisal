"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str } from "@/lib/action-helpers";
import type { AttendanceStatus } from "@prisma/client";

export async function saveTimesheetForDate(formData: FormData) {
  const session = await requireModuleAccess("TIMESHEET", "write");
  const projectId = await getCurrentProjectId();
  const date = str(formData, "date");
  if (!projectId || !date) redirectWithError("/timesheet", "Project and date are required.");

  const parsedDate = new Date(date);
  const employeeIds = formData.getAll("employeeId").map(String);

  for (const employeeId of employeeIds) {
    const status = (str(formData, `status_${employeeId}`) || "PRESENT") as AttendanceStatus;
    const normalHours = Number(str(formData, `normal_${employeeId}`) || "0") || 0;
    const overtimeHours = Number(str(formData, `overtime_${employeeId}`) || "0") || 0;
    const remarks = str(formData, `remarks_${employeeId}`) || undefined;

    if (normalHours < 0 || overtimeHours < 0) {
      redirectWithError("/timesheet", "Man-hours cannot be negative.");
    }

    await prisma.timesheet.upsert({
      where: { employeeId_date: { employeeId, date: parsedDate } },
      update: { status, normalHours, overtimeHours, remarks },
      create: {
        projectId: projectId!,
        employeeId,
        date: parsedDate,
        status,
        normalHours,
        overtimeHours,
        remarks,
      },
    });
  }

  await writeAuditLog({
    projectId,
    entityType: "TIMESHEET",
    entityId: date,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: { date, employeeCount: employeeIds.length },
  });

  revalidatePath("/timesheet");
  revalidatePath("/man-hours");
  redirect(`/timesheet?date=${date}&saved=1`);
}
