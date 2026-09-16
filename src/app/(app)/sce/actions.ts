"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { recordEquipmentHistoryEvent } from "@/lib/equipment-history";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { InspectionResult } from "@prisma/client";

function addInterval(date: Date, frequency: string | null): Date {
  const next = new Date(date);
  switch (frequency) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "SEMI_ANNUAL":
      next.setMonth(next.getMonth() + 6);
      break;
    default:
      next.setFullYear(next.getFullYear() + 1); // ANNUAL default
  }
  return next;
}

export async function recordSceInspection(formData: FormData) {
  const session = await requireModuleAccess("SCE", "write");
  const sceRecordId = str(formData, "sceRecordId");
  const record = await prisma.sceRecord.findUniqueOrThrow({ where: { id: sceRecordId }, include: { equipment: true } });

  const date = optDate(formData, "date") ?? new Date();
  const result = (optStr(formData, "result") as InspectionResult) ?? "PASS";
  if (!result) redirectWithError(`/sce/${sceRecordId}`, "Result is required.");

  const inspection = await prisma.sceInspection.create({
    data: {
      sceRecordId,
      date,
      result,
      performedBy: optStr(formData, "performedBy"),
      finding: optStr(formData, "finding"),
      remarks: optStr(formData, "remarks"),
    },
  });

  const testFrequency = optStr(formData, "testFrequency") ?? record.testFrequency;
  const nextDueDate = addInterval(date, testFrequency ?? null);

  await prisma.sceRecord.update({
    where: { id: sceRecordId },
    data: {
      testFrequency,
      lastTestDate: date,
      nextDueDate,
      status: result === "PASS" ? "VERIFIED" : "DUE",
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId: record.equipmentId,
    eventDate: date,
    eventType: "SCE",
    sourceId: inspection.id,
    title: `SCE inspection — ${result}`,
    summary: inspection.finding ?? undefined,
  });

  await writeAuditLog({
    projectId: record.projectId,
    entityType: "SCE",
    entityId: record.id,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: { inspection, nextDueDate },
  });

  revalidatePath("/sce");
  revalidatePath(`/sce/${sceRecordId}`);
  redirect(`/sce/${sceRecordId}`);
}

export async function updateSceRecord(formData: FormData) {
  const session = await requireModuleAccess("SCE", "write");
  const id = str(formData, "id");
  const before = await prisma.sceRecord.findUniqueOrThrow({ where: { id } });

  const record = await prisma.sceRecord.update({
    where: { id },
    data: {
      sceCategory: str(formData, "sceCategory") || before.sceCategory,
      criticalFunction: optStr(formData, "criticalFunction"),
      inspectionRequirement: optStr(formData, "inspectionRequirement"),
      testFrequency: optStr(formData, "testFrequency"),
      responsiblePerson: optStr(formData, "responsiblePerson"),
    },
  });

  await writeAuditLog({
    projectId: record.projectId,
    entityType: "SCE",
    entityId: record.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: record,
  });

  revalidatePath(`/sce/${id}`);
  redirect(`/sce/${id}`);
}
