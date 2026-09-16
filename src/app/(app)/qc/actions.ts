"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { InspectionResult, NcrSeverity, TrackerStatus } from "@prisma/client";

export async function createQcInspection(formData: FormData) {
  const session = await requireModuleAccess("QC", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/qc/inspections/new", "Select a project first.");

  const date = optDate(formData, "date");
  if (!date) redirectWithError("/qc/inspections/new", "Date is required.");

  const inspection = await prisma.qcInspection.create({
    data: {
      projectId: projectId!,
      date: date!,
      equipmentTag: optStr(formData, "equipmentTag"),
      inspectionType: optStr(formData, "inspectionType"),
      inspector: optStr(formData, "inspector"),
      result: (optStr(formData, "result") as InspectionResult) ?? "PENDING",
      remarks: optStr(formData, "remarks"),
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "QC_INSPECTION",
    entityId: inspection.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: inspection,
  });

  revalidatePath("/qc");
  redirect("/qc");
}

export async function createNcr(formData: FormData) {
  const session = await requireModuleAccess("QC", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/qc/ncrs/new", "Select a project first.");

  const ncrNumber = str(formData, "ncrNumber");
  const description = str(formData, "description");
  const date = optDate(formData, "date");
  if (!ncrNumber || !description || !date) {
    redirectWithError("/qc/ncrs/new", "NCR number, date and description are required.");
  }

  const existing = await prisma.ncr.findUnique({
    where: { projectId_ncrNumber: { projectId: projectId!, ncrNumber } },
  });
  if (existing) redirectWithError("/qc/ncrs/new", `NCR number "${ncrNumber}" already exists.`);

  const ncr = await prisma.ncr.create({
    data: {
      projectId: projectId!,
      ncrNumber,
      date: date!,
      equipmentTag: optStr(formData, "equipmentTag"),
      description,
      category: optStr(formData, "category"),
      severity: (optStr(formData, "severity") as NcrSeverity) ?? "MINOR",
      responsiblePerson: optStr(formData, "responsiblePerson"),
      targetDate: optDate(formData, "targetDate"),
      status: "OPEN",
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "NCR",
    entityId: ncr.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: ncr,
  });

  revalidatePath("/qc");
  redirect(`/qc/ncrs/${ncr.id}`);
}

export async function updateNcr(formData: FormData) {
  const session = await requireModuleAccess("QC", "write");
  const id = str(formData, "id");
  const before = await prisma.ncr.findUniqueOrThrow({ where: { id } });

  const status = (optStr(formData, "status") as TrackerStatus) ?? before.status;
  const closureDate = optDate(formData, "closureDate");
  if (status === "CLOSED" && !closureDate) {
    redirectWithError(`/qc/ncrs/${id}`, "A closed NCR requires a closure date and evidence.");
  }

  const ncr = await prisma.ncr.update({
    where: { id },
    data: {
      status,
      closureDate,
      evidence: optStr(formData, "evidence"),
    },
  });

  await writeAuditLog({
    projectId: ncr.projectId,
    entityType: "NCR",
    entityId: ncr.id,
    action: status !== before.status ? "STATUS_CHANGE" : "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: ncr,
  });

  revalidatePath("/qc");
  revalidatePath(`/qc/ncrs/${id}`);
  redirect(`/qc/ncrs/${ncr.id}`);
}
