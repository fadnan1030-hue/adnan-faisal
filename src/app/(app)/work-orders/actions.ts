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
import type { MaintenanceStatus, Priority, WorkOrderType } from "@prisma/client";

export async function createWorkOrder(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/work-orders/new", "Select a project first.");

  const workOrderNumber = str(formData, "workOrderNumber");
  if (!workOrderNumber) redirectWithError("/work-orders/new", "Work order number is required.");

  const existing = await prisma.workOrder.findUnique({
    where: { projectId_workOrderNumber: { projectId: projectId!, workOrderNumber } },
  });
  if (existing) {
    redirectWithError("/work-orders/new", `Work order "${workOrderNumber}" already exists.`);
  }

  const equipmentId = await resolveEquipmentTag(projectId!, optStr(formData, "equipmentTag"), "/work-orders/new");

  const workOrder = await prisma.workOrder.create({
    data: {
      projectId: projectId!,
      workOrderNumber,
      workCenter: optStr(formData, "workCenter"),
      operationShortText: optStr(formData, "operationShortText"),
      operationDescription: optStr(formData, "operationDescription"),
      scope: optStr(formData, "scope"),
      equipmentId,
      equipmentSortField: optStr(formData, "equipmentTag"),
      location: optStr(formData, "location"),
      abcIndicator: optStr(formData, "abcIndicator"),
      priority: (optStr(formData, "priority") as Priority) ?? "MEDIUM",
      type: (optStr(formData, "type") as WorkOrderType) ?? "PM",
      plannedStartDate: optDate(formData, "plannedStartDate"),
      plannedFinishDate: optDate(formData, "plannedFinishDate"),
      earliestFinishDate: optDate(formData, "earliestFinishDate"),
      actualStartDate: optDate(formData, "actualStartDate"),
      actualFinishDate: optDate(formData, "actualFinishDate"),
      plannedHours: optDecimal(formData, "plannedHours"),
      actualHours: optDecimal(formData, "actualHours"),
      responsibleParty: optStr(formData, "responsibleParty"),
      status: (optStr(formData, "status") as MaintenanceStatus) ?? "PLANNED",
      remarks: optStr(formData, "remarks"),
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId,
    eventDate: workOrder.plannedStartDate ?? workOrder.createdAt,
    eventType: "WORK_ORDER",
    sourceId: workOrder.id,
    title: `Work order ${workOrder.workOrderNumber} created`,
    summary: workOrder.scope ?? workOrder.operationShortText,
  });

  await writeAuditLog({
    projectId,
    entityType: "WORK_ORDER",
    entityId: workOrder.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: workOrder,
  });

  revalidatePath("/work-orders");
  redirect(`/work-orders/${workOrder.id}`);
}

export async function updateWorkOrder(formData: FormData) {
  const session = await requireModuleAccess("MAINTENANCE", "write");
  const id = str(formData, "id");
  const before = await prisma.workOrder.findUniqueOrThrow({ where: { id } });

  const equipmentId = await resolveEquipmentTag(
    before.projectId,
    optStr(formData, "equipmentTag"),
    `/work-orders/${id}/edit`
  );

  const actualStart = optDate(formData, "actualStartDate");
  const actualFinish = optDate(formData, "actualFinishDate");
  if (actualStart && actualFinish && actualFinish < actualStart) {
    redirectWithError(`/work-orders/${id}/edit`, "Actual finish cannot be before actual start.");
  }

  const status = (optStr(formData, "status") as MaintenanceStatus) ?? before.status;
  if (status === "COMPLETED" && !actualFinish) {
    redirectWithError(`/work-orders/${id}/edit`, "A completed work order requires an actual finish date.");
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: {
      workCenter: optStr(formData, "workCenter"),
      operationShortText: optStr(formData, "operationShortText"),
      operationDescription: optStr(formData, "operationDescription"),
      scope: optStr(formData, "scope"),
      equipmentId,
      equipmentSortField: optStr(formData, "equipmentTag"),
      location: optStr(formData, "location"),
      abcIndicator: optStr(formData, "abcIndicator"),
      priority: (optStr(formData, "priority") as Priority) ?? before.priority,
      type: (optStr(formData, "type") as WorkOrderType) ?? before.type,
      plannedStartDate: optDate(formData, "plannedStartDate"),
      plannedFinishDate: optDate(formData, "plannedFinishDate"),
      earliestFinishDate: optDate(formData, "earliestFinishDate"),
      actualStartDate: actualStart,
      actualFinishDate: actualFinish,
      plannedHours: optDecimal(formData, "plannedHours"),
      actualHours: optDecimal(formData, "actualHours"),
      responsibleParty: optStr(formData, "responsibleParty"),
      status,
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId: workOrder.projectId,
    entityType: "WORK_ORDER",
    entityId: workOrder.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: workOrder,
  });

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  redirect(`/work-orders/${workOrder.id}`);
}
