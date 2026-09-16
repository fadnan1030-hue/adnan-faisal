"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str, optStr, optDate, checkbox } from "@/lib/action-helpers";
import { ensureSceRecord } from "@/lib/sce";
import type { Criticality, EquipmentStatus } from "@prisma/client";

export async function createEquipment(formData: FormData) {
  const session = await requireModuleAccess("EQUIPMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/equipment/new", "Select a project first.");

  const tagNumber = str(formData, "tagNumber");
  const description = str(formData, "description");
  if (!tagNumber || !description) {
    redirectWithError("/equipment/new", "Tag number and description are required.");
  }

  const existing = await prisma.equipment.findUnique({
    where: { projectId_tagNumber: { projectId: projectId!, tagNumber } },
  });
  if (existing) {
    redirectWithError("/equipment/new", `Equipment tag "${tagNumber}" already exists in this project.`);
  }

  const equipment = await prisma.equipment.create({
    data: {
      projectId: projectId!,
      tagNumber,
      description,
      equipmentType: optStr(formData, "equipmentType"),
      equipmentCategory: optStr(formData, "equipmentCategory"),
      area: optStr(formData, "area"),
      unit: optStr(formData, "unit"),
      location: optStr(formData, "location"),
      system: optStr(formData, "system"),
      subsystem: optStr(formData, "subsystem"),
      manufacturer: optStr(formData, "manufacturer"),
      model: optStr(formData, "model"),
      serialNumber: optStr(formData, "serialNumber"),
      criticality: (optStr(formData, "criticality") as Criticality) ?? "MEDIUM",
      abcIndicator: optStr(formData, "abcIndicator"),
      isSce: checkbox(formData, "isSce"),
      sceCategory: optStr(formData, "sceCategory"),
      discipline: optStr(formData, "discipline"),
      responsibleTeam: optStr(formData, "responsibleTeam"),
      maintenanceStrategy: optStr(formData, "maintenanceStrategy"),
      pmFrequency: optStr(formData, "pmFrequency"),
      installationDate: optDate(formData, "installationDate"),
      commissioningDate: optDate(formData, "commissioningDate"),
      operationalStatus: (optStr(formData, "operationalStatus") as EquipmentStatus) ?? "OPERATIONAL",
      notes: optStr(formData, "notes"),
    },
  });

  await ensureSceRecord(equipment);

  await writeAuditLog({
    projectId,
    entityType: "EQUIPMENT",
    entityId: equipment.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: equipment,
  });

  revalidatePath("/equipment");
  redirect(`/equipment/${equipment.id}`);
}

export async function updateEquipment(formData: FormData) {
  const session = await requireModuleAccess("EQUIPMENT", "write");
  const id = str(formData, "id");
  const before = await prisma.equipment.findUniqueOrThrow({ where: { id } });

  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      description: str(formData, "description") || before.description,
      equipmentType: optStr(formData, "equipmentType"),
      equipmentCategory: optStr(formData, "equipmentCategory"),
      area: optStr(formData, "area"),
      unit: optStr(formData, "unit"),
      location: optStr(formData, "location"),
      system: optStr(formData, "system"),
      subsystem: optStr(formData, "subsystem"),
      manufacturer: optStr(formData, "manufacturer"),
      model: optStr(formData, "model"),
      serialNumber: optStr(formData, "serialNumber"),
      criticality: (optStr(formData, "criticality") as Criticality) ?? before.criticality,
      abcIndicator: optStr(formData, "abcIndicator"),
      isSce: checkbox(formData, "isSce"),
      sceCategory: optStr(formData, "sceCategory"),
      discipline: optStr(formData, "discipline"),
      responsibleTeam: optStr(formData, "responsibleTeam"),
      maintenanceStrategy: optStr(formData, "maintenanceStrategy"),
      pmFrequency: optStr(formData, "pmFrequency"),
      installationDate: optDate(formData, "installationDate"),
      commissioningDate: optDate(formData, "commissioningDate"),
      operationalStatus: (optStr(formData, "operationalStatus") as EquipmentStatus) ?? before.operationalStatus,
      active: checkbox(formData, "active"),
      notes: optStr(formData, "notes"),
    },
  });

  await ensureSceRecord(equipment);

  await writeAuditLog({
    projectId: equipment.projectId,
    entityType: "EQUIPMENT",
    entityId: equipment.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: equipment,
  });

  revalidatePath("/equipment");
  revalidatePath(`/equipment/${id}`);
  redirect(`/equipment/${equipment.id}`);
}
