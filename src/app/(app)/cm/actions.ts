"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { recordEquipmentHistoryEvent } from "@/lib/equipment-history";
import { resolveEquipmentTag } from "@/lib/equipment-lookup";
import { redirectWithError, str, optStr, optDate, optDecimal } from "@/lib/action-helpers";
import type { MaintenanceStatus, Priority } from "@prisma/client";

export async function createCmRecord(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/cm/new", "Select a project first.");

  const equipmentTag = str(formData, "equipmentTag");
  if (!equipmentTag) redirectWithError("/cm/new", "Equipment tag is required.");
  const equipmentId = await resolveEquipmentTag(projectId!, equipmentTag, "/cm/new");

  const breakdownDate = optDate(formData, "breakdownDate");
  if (!breakdownDate) redirectWithError("/cm/new", "Breakdown date is required.");

  const record = await prisma.cmRecord.create({
    data: {
      projectId: projectId!,
      equipmentId: equipmentId!,
      breakdownDate: breakdownDate!,
      notificationDate: optDate(formData, "notificationDate"),
      priority: (optStr(formData, "priority") as Priority) ?? "MEDIUM",
      failureDescription: optStr(formData, "failureDescription"),
      problemStatement: optStr(formData, "problemStatement"),
      status: "PLANNED",
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId,
    eventDate: record.breakdownDate,
    eventType: "CM",
    sourceId: record.id,
    title: "Breakdown / CM reported",
    summary: record.failureDescription,
  });

  await writeAuditLog({
    projectId,
    entityType: "CM",
    entityId: record.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: record,
  });

  revalidatePath("/cm");
  redirect(`/cm/${record.id}`);
}

export async function updateCmRecord(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const id = str(formData, "id");
  const before = await prisma.cmRecord.findUniqueOrThrow({ where: { id } });

  const actualStart = optDate(formData, "actualStart");
  const actualFinish = optDate(formData, "actualFinish");
  if (actualStart && actualFinish && actualFinish < actualStart) {
    redirectWithError(`/cm/${id}/edit`, "Actual finish cannot be before actual start.");
  }

  const status = (optStr(formData, "status") as MaintenanceStatus) ?? before.status;
  if (status === "COMPLETED" && !actualFinish) {
    redirectWithError(`/cm/${id}/edit`, "A completed CM requires an actual finish date.");
  }

  const record = await prisma.cmRecord.update({
    where: { id },
    data: {
      notificationDate: optDate(formData, "notificationDate"),
      priority: (optStr(formData, "priority") as Priority) ?? before.priority,
      failureDescription: optStr(formData, "failureDescription"),
      problemStatement: optStr(formData, "problemStatement"),
      finding: optStr(formData, "finding"),
      failureMode: optStr(formData, "failureMode"),
      rootCause: optStr(formData, "rootCause"),
      correctiveAction: optStr(formData, "correctiveAction"),
      spareParts: optStr(formData, "spareParts"),
      plannedHours: optDecimal(formData, "plannedHours"),
      actualHours: optDecimal(formData, "actualHours"),
      actualStart,
      actualFinish,
      status,
      downtimeHours: optDecimal(formData, "downtimeHours"),
      productionImpact: optStr(formData, "productionImpact"),
      recommendation: optStr(formData, "recommendation"),
    },
  });

  await writeAuditLog({
    projectId: record.projectId,
    entityType: "CM",
    entityId: record.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: record,
  });

  revalidatePath("/cm");
  revalidatePath(`/cm/${id}`);
  redirect(`/cm/${record.id}`);
}
