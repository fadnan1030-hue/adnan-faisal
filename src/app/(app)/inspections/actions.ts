"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { recordEquipmentHistoryEvent } from "@/lib/equipment-history";
import { resolveEquipmentTag } from "@/lib/equipment-lookup";
import { redirectWithError, optStr, optDate } from "@/lib/action-helpers";
import type { InspectionResult, InspectionType } from "@prisma/client";

export async function createInspection(formData: FormData) {
  const session = await requireModuleAccess("INSPECTIONS", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/inspections/new", "Select a project first.");

  const date = optDate(formData, "date");
  if (!date) redirectWithError("/inspections/new", "Date is required.");

  const equipmentId = await resolveEquipmentTag(projectId!, optStr(formData, "equipmentTag"), "/inspections/new");

  const inspection = await prisma.inspection.create({
    data: {
      projectId: projectId!,
      equipmentId,
      type: (optStr(formData, "type") as InspectionType) ?? "GENERAL",
      date: date!,
      inspector: optStr(formData, "inspector"),
      result: (optStr(formData, "result") as InspectionResult) ?? "PENDING",
      remarks: optStr(formData, "remarks"),
    },
  });

  await recordEquipmentHistoryEvent({
    equipmentId,
    eventDate: date!,
    eventType: "INSPECTION",
    sourceId: inspection.id,
    title: `Inspection — ${inspection.type}`,
    summary: inspection.remarks ?? undefined,
  });

  await writeAuditLog({
    projectId,
    entityType: "INSPECTION",
    entityId: inspection.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: inspection,
  });

  revalidatePath("/inspections");
  redirect("/inspections");
}
