"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { recordEquipmentHistoryEvent } from "@/lib/equipment-history";
import { resolveEquipmentTag } from "@/lib/equipment-lookup";
import { saveUploadedFile } from "@/lib/file-storage";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { FindingSeverity, RiskLevel, TrackerStatus, PhotoCategory } from "@prisma/client";

export async function createFinding(formData: FormData) {
  const session = await requireModuleAccess("FINDINGS", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/findings/new", "Select a project first.");

  const description = str(formData, "description");
  const category = str(formData, "category");
  const date = optDate(formData, "date") ?? new Date();
  if (!description || !category) {
    redirectWithError("/findings/new", "Category and description are required.");
  }

  const equipmentId = await resolveEquipmentTag(projectId!, optStr(formData, "equipmentTag"), "/findings/new");
  const workOrderId = optStr(formData, "workOrderId");
  const pmRecordId = optStr(formData, "pmRecordId");
  const cmRecordId = optStr(formData, "cmRecordId");
  const inspectionId = optStr(formData, "inspectionId");

  const finding = await prisma.finding.create({
    data: {
      projectId: projectId!,
      equipmentId,
      workOrderId,
      pmRecordId,
      cmRecordId,
      inspectionId,
      date,
      category,
      description,
      severity: (optStr(formData, "severity") as FindingSeverity) ?? "MEDIUM",
      riskLevel: (optStr(formData, "riskLevel") as RiskLevel) ?? "MEDIUM",
      immediateAction: optStr(formData, "immediateAction"),
      recommendedAction: optStr(formData, "recommendedAction"),
      responsiblePerson: optStr(formData, "responsiblePerson"),
      targetDate: optDate(formData, "targetDate"),
      status: "OPEN",
      createdById: session.user.id,
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId,
    eventDate: date,
    eventType: "FINDING",
    sourceId: finding.id,
    title: `Finding — ${category}`,
    summary: description,
  });

  await writeAuditLog({
    projectId,
    entityType: "FINDING",
    entityId: finding.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: finding,
  });

  // Photos may be attached at creation time (mobile quick-entry flow, spec section 48)
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const saved = await saveUploadedFile(file, "photos");
    await prisma.photo.create({
      data: {
        projectId: projectId!,
        equipmentId,
        findingId: finding.id,
        category: "FINDING",
        filePath: saved.filePath,
        fileSize: saved.fileSize,
        uploadedById: session.user.id,
      },
    });
  }

  revalidatePath("/findings");
  redirect(`/findings/${finding.id}`);
}

export async function updateFinding(formData: FormData) {
  const session = await requireModuleAccess("FINDINGS", "write");
  const id = str(formData, "id");
  const before = await prisma.finding.findUniqueOrThrow({ where: { id } });

  const status = (optStr(formData, "status") as TrackerStatus) ?? before.status;
  const closureDate = optDate(formData, "closureDate");
  if (status === "CLOSED" && !closureDate) {
    redirectWithError(`/findings/${id}/edit`, "A closed finding requires a closure date.");
  }

  const finding = await prisma.finding.update({
    where: { id },
    data: {
      category: str(formData, "category") || before.category,
      description: str(formData, "description") || before.description,
      severity: (optStr(formData, "severity") as FindingSeverity) ?? before.severity,
      riskLevel: (optStr(formData, "riskLevel") as RiskLevel) ?? before.riskLevel,
      immediateAction: optStr(formData, "immediateAction"),
      recommendedAction: optStr(formData, "recommendedAction"),
      responsiblePerson: optStr(formData, "responsiblePerson"),
      targetDate: optDate(formData, "targetDate"),
      status,
      closureDate,
      verifiedBy: optStr(formData, "verifiedBy"),
      verificationDate: optDate(formData, "verificationDate"),
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId: finding.projectId,
    entityType: "FINDING",
    entityId: finding.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: finding,
  });

  revalidatePath("/findings");
  revalidatePath(`/findings/${id}`);
  redirect(`/findings/${finding.id}`);
}

export async function uploadFindingPhotos(formData: FormData) {
  const session = await requireModuleAccess("FINDINGS", "write");
  const findingId = str(formData, "findingId");
  const finding = await prisma.finding.findUniqueOrThrow({ where: { id: findingId } });

  const category = (optStr(formData, "category") as PhotoCategory) ?? "FINDING";
  const caption = optStr(formData, "caption");
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    const saved = await saveUploadedFile(file, "photos");
    await prisma.photo.create({
      data: {
        projectId: finding.projectId,
        equipmentId: finding.equipmentId,
        findingId: finding.id,
        category,
        caption,
        filePath: saved.filePath,
        fileSize: saved.fileSize,
        uploadedById: session.user.id,
      },
    });
  }

  revalidatePath(`/findings/${findingId}`);
  redirect(`/findings/${findingId}`);
}
