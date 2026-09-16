"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { resolveEquipmentTag } from "@/lib/equipment-lookup";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { Priority, SourceModule, TrackerStatus } from "@prisma/client";

export async function createAction(formData: FormData) {
  const session = await requireModuleAccess("ACTIONS", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/actions/new", "Select a project first.");

  const description = str(formData, "description");
  if (!description) redirectWithError("/actions/new", "Description is required.");

  const equipmentId = await resolveEquipmentTag(projectId!, optStr(formData, "equipmentTag"), "/actions/new");

  const action = await prisma.action.create({
    data: {
      projectId: projectId!,
      sourceModule: (optStr(formData, "sourceModule") as SourceModule) ?? "ACTION",
      sourceId: optStr(formData, "sourceId"),
      equipmentId,
      findingId: optStr(formData, "findingId"),
      workOrderId: optStr(formData, "workOrderId"),
      pmRecordId: optStr(formData, "pmRecordId"),
      cmRecordId: optStr(formData, "cmRecordId"),
      description,
      responsiblePerson: optStr(formData, "responsiblePerson"),
      priority: (optStr(formData, "priority") as Priority) ?? "MEDIUM",
      targetDate: optDate(formData, "targetDate"),
      status: "OPEN",
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "ACTION",
    entityId: action.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: action,
  });

  revalidatePath("/actions");
  const backTo = optStr(formData, "returnTo");
  redirect(backTo ?? `/actions/${action.id}`);
}

export async function updateAction(formData: FormData) {
  const session = await requireModuleAccess("ACTIONS", "write");
  const id = str(formData, "id");
  const before = await prisma.action.findUniqueOrThrow({ where: { id } });

  const status = (optStr(formData, "status") as TrackerStatus) ?? before.status;
  const closureDate = optDate(formData, "closureDate");
  if (status === "CLOSED" && !closureDate) {
    redirectWithError(`/actions/${id}/edit`, "A closed action requires closure evidence and a closure date.");
  }
  if (status === "CLOSED" && !str(formData, "closureEvidence") && !before.closureEvidence) {
    redirectWithError(`/actions/${id}/edit`, "A closed action requires closure evidence.");
  }

  const action = await prisma.action.update({
    where: { id },
    data: {
      description: str(formData, "description") || before.description,
      responsiblePerson: optStr(formData, "responsiblePerson"),
      priority: (optStr(formData, "priority") as Priority) ?? before.priority,
      targetDate: optDate(formData, "targetDate"),
      status,
      closureDate,
      closureEvidence: optStr(formData, "closureEvidence"),
      verifiedBy: optStr(formData, "verifiedBy"),
      verificationDate: optDate(formData, "verificationDate"),
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId: action.projectId,
    entityType: "ACTION",
    entityId: action.id,
    action: status === "CLOSED" ? "CLOSURE" : status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: action,
  });

  revalidatePath("/actions");
  revalidatePath(`/actions/${id}`);
  redirect(`/actions/${action.id}`);
}
