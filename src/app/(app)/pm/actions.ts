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
import type { Criticality, MaintenanceStatus, Priority } from "@prisma/client";

export async function createPmRecord(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/pm/new", "Select a project first.");

  const equipmentTag = str(formData, "equipmentTag");
  if (!equipmentTag) redirectWithError("/pm/new", "Equipment tag is required.");
  const equipmentId = await resolveEquipmentTag(projectId!, equipmentTag, "/pm/new");

  const plannedDate = optDate(formData, "plannedDate");
  if (!plannedDate) redirectWithError("/pm/new", "Planned date is required.");

  const record = await prisma.pmRecord.create({
    data: {
      projectId: projectId!,
      equipmentId: equipmentId!,
      pmType: optStr(formData, "pmType"),
      pmFrequency: optStr(formData, "pmFrequency"),
      plannedDate: plannedDate!,
      plannedStart: optDate(formData, "plannedStart"),
      plannedFinish: optDate(formData, "plannedFinish"),
      plannedHours: optDecimal(formData, "plannedHours"),
      responsibleDiscipline: optStr(formData, "responsibleDiscipline"),
      workCenter: optStr(formData, "workCenter"),
      location: optStr(formData, "location"),
      priority: (optStr(formData, "priority") as Priority) ?? "MEDIUM",
      criticality: (optStr(formData, "criticality") as Criticality) ?? "MEDIUM",
      status: "PLANNED",
      remarks: optStr(formData, "remarks"),
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId,
    eventDate: record.plannedDate,
    eventType: "PM",
    sourceId: record.id,
    title: `PM planned${record.pmType ? ` — ${record.pmType}` : ""}`,
  });

  await writeAuditLog({
    projectId,
    entityType: "PM",
    entityId: record.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: record,
  });

  revalidatePath("/pm");
  redirect(`/pm/${record.id}`);
}

export async function updatePmRecord(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const id = str(formData, "id");
  const before = await prisma.pmRecord.findUniqueOrThrow({ where: { id } });

  const actualStart = optDate(formData, "actualStart");
  const actualFinish = optDate(formData, "actualFinish");
  if (actualStart && actualFinish && actualFinish < actualStart) {
    redirectWithError(`/pm/${id}/edit`, "Actual finish cannot be before actual start.");
  }

  const status = (optStr(formData, "status") as MaintenanceStatus) ?? before.status;
  if ((status === "COMPLETED" || status === "PARTIALLY_COMPLETED") && !actualFinish) {
    redirectWithError(`/pm/${id}/edit`, "A completed PM requires an actual finish date.");
  }

  const record = await prisma.pmRecord.update({
    where: { id },
    data: {
      pmType: optStr(formData, "pmType"),
      pmFrequency: optStr(formData, "pmFrequency"),
      plannedDate: optDate(formData, "plannedDate") ?? before.plannedDate,
      plannedStart: optDate(formData, "plannedStart"),
      plannedFinish: optDate(formData, "plannedFinish"),
      actualStart,
      actualFinish,
      plannedHours: optDecimal(formData, "plannedHours"),
      actualHours: optDecimal(formData, "actualHours"),
      responsibleDiscipline: optStr(formData, "responsibleDiscipline"),
      workCenter: optStr(formData, "workCenter"),
      location: optStr(formData, "location"),
      priority: (optStr(formData, "priority") as Priority) ?? before.priority,
      criticality: (optStr(formData, "criticality") as Criticality) ?? before.criticality,
      status,
      findingsText: optStr(formData, "findingsText"),
      correctiveAction: optStr(formData, "correctiveAction"),
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId: record.projectId,
    entityType: "PM",
    entityId: record.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: record,
  });

  revalidatePath("/pm");
  revalidatePath(`/pm/${id}`);
  redirect(`/pm/${record.id}`);
}
