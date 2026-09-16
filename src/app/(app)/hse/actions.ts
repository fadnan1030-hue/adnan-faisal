"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { IncidentType, TrackerStatus } from "@prisma/client";

export async function createHseIncident(formData: FormData) {
  const session = await requireModuleAccess("HSE", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/hse/incidents/new", "Select a project first.");

  const description = str(formData, "description");
  const incidentDate = optDate(formData, "incidentDate");
  if (!description || !incidentDate) {
    redirectWithError("/hse/incidents/new", "Incident date and description are required.");
  }

  const incident = await prisma.hseIncident.create({
    data: {
      projectId: projectId!,
      incidentDate: incidentDate!,
      incidentType: (optStr(formData, "incidentType") as IncidentType) ?? "OTHER",
      description,
      location: optStr(formData, "location"),
      personnelAffected: optStr(formData, "personnelAffected"),
      investigationStatus: "OPEN",
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "HSE_INCIDENT",
    entityId: incident.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: incident,
  });

  revalidatePath("/hse");
  redirect(`/hse/incidents/${incident.id}`);
}

export async function updateHseIncident(formData: FormData) {
  const session = await requireModuleAccess("HSE", "write");
  const id = str(formData, "id");
  const before = await prisma.hseIncident.findUniqueOrThrow({ where: { id } });

  const incident = await prisma.hseIncident.update({
    where: { id },
    data: {
      rootCause: optStr(formData, "rootCause"),
      correctiveActions: optStr(formData, "correctiveActions"),
      investigationStatus: (optStr(formData, "investigationStatus") as TrackerStatus) ?? before.investigationStatus,
      closureDate: optDate(formData, "closureDate"),
    },
  });

  await writeAuditLog({
    projectId: incident.projectId,
    entityType: "HSE_INCIDENT",
    entityId: incident.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: incident,
  });

  revalidatePath("/hse");
  revalidatePath(`/hse/incidents/${id}`);
  redirect(`/hse/incidents/${incident.id}`);
}

export async function createHseObservation(formData: FormData) {
  const session = await requireModuleAccess("HSE", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/hse/observations/new", "Select a project first.");

  const description = str(formData, "description");
  const date = optDate(formData, "date");
  if (!description || !date) {
    redirectWithError("/hse/observations/new", "Date and description are required.");
  }

  const observation = await prisma.hseObservation.create({
    data: {
      projectId: projectId!,
      date: date!,
      observer: optStr(formData, "observer"),
      area: optStr(formData, "area"),
      equipmentTag: optStr(formData, "equipmentTag"),
      category: optStr(formData, "category"),
      isPositive: str(formData, "isPositive") === "true",
      description,
      immediateAction: optStr(formData, "immediateAction"),
      responsiblePerson: optStr(formData, "responsiblePerson"),
      targetDate: optDate(formData, "targetDate"),
      status: "OPEN",
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "HSE_OBSERVATION",
    entityId: observation.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: observation,
  });

  revalidatePath("/hse");
  redirect(`/hse/observations/${observation.id}`);
}

export async function updateHseObservation(formData: FormData) {
  const session = await requireModuleAccess("HSE", "write");
  const id = str(formData, "id");
  const before = await prisma.hseObservation.findUniqueOrThrow({ where: { id } });

  const status = (optStr(formData, "status") as TrackerStatus) ?? before.status;
  const closureDate = optDate(formData, "closureDate");
  if (status === "CLOSED" && !closureDate) {
    redirectWithError(`/hse/observations/${id}/edit`, "A closed observation requires a closure date.");
  }

  const observation = await prisma.hseObservation.update({
    where: { id },
    data: {
      correctiveAction: optStr(formData, "correctiveAction"),
      status,
      closureDate,
    },
  });

  await writeAuditLog({
    projectId: observation.projectId,
    entityType: "HSE_OBSERVATION",
    entityId: observation.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: observation,
  });

  revalidatePath("/hse");
  revalidatePath(`/hse/observations/${id}`);
  redirect(`/hse/observations/${observation.id}`);
}
