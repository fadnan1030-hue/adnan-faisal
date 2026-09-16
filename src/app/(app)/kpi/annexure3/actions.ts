"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, optDate, optDecimal, optInt, checkbox } from "@/lib/action-helpers";

const PAGE = "/kpi/annexure3";

export async function saveRosterSettings(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError(PAGE, "Select a project first.");

  const data = {
    availableMhrsPerWeek: optDecimal(formData, "availableMhrsPerWeek"),
    rosterDirectQty: optInt(formData, "rosterDirectQty"),
    rosterIndirectQty: optInt(formData, "rosterIndirectQty"),
    rosterStandardHours: optDecimal(formData, "rosterStandardHours"),
  };

  await prisma.project.update({ where: { id: projectId! }, data });

  await writeAuditLog({
    projectId,
    entityType: "PROJECT",
    entityId: projectId!,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: data,
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function saveReportBaseline(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError(PAGE, "Select a project first.");

  const data = {
    reportNoBaseline: optInt(formData, "reportNoBaseline"),
    reportNoBaseDate: optDate(formData, "reportNoBaseDate"),
  };

  await prisma.project.update({ where: { id: projectId! }, data });

  await writeAuditLog({
    projectId,
    entityType: "PROJECT",
    entityId: projectId!,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: data,
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function saveDailyManHours(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError(PAGE, "Select a project first.");

  const date = optDate(formData, "date");
  if (!date) redirectWithError(PAGE, "Report date is required.");

  const data = {
    ltiOccurred: checkbox(formData, "ltiOccurred"),
    directEmergencyMH: optDecimal(formData, "directEmergencyMH") ?? 0,
    indirectEmergencyMH: optDecimal(formData, "indirectEmergencyMH") ?? 0,
  };

  const entry = await prisma.kpiDailyEntry.upsert({
    where: { projectId_date: { projectId: projectId!, date: date! } },
    update: data,
    create: { projectId: projectId!, date: date!, ...data },
  });

  await writeAuditLog({
    projectId,
    entityType: "KPI",
    entityId: entry.id,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: data,
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function saveKpiInputs(formData: FormData) {
  const session = await requireModuleAccess("KPI_MANAGEMENT", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError(PAGE, "Select a project first.");

  const date = optDate(formData, "date");
  if (!date) redirectWithError(PAGE, "Report date is required.");

  const data = {
    zeroLeakage: checkbox(formData, "zeroLeakage"),
    noRework: checkbox(formData, "noRework"),
    trif: optDecimal(formData, "trif"),
    ptwPct: optDecimal(formData, "ptwPct"),
    lsrViolations: optInt(formData, "lsrViolations"),
    otherLsrPct: optDecimal(formData, "otherLsrPct"),
    lsrCloseoutPct: optDecimal(formData, "lsrCloseoutPct"),
    safetyObsPct: optDecimal(formData, "safetyObsPct"),
    leadershipWalkPct: optDecimal(formData, "leadershipWalkPct"),
    vehicleIncidents: optInt(formData, "vehicleIncidents"),
    securityViolations: optInt(formData, "securityViolations"),
    spills: optInt(formData, "spills"),
  };

  const entry = await prisma.kpiDailyEntry.upsert({
    where: { projectId_date: { projectId: projectId!, date: date! } },
    update: data,
    create: { projectId: projectId!, date: date!, ...data },
  });

  await writeAuditLog({
    projectId,
    entityType: "KPI",
    entityId: entry.id,
    action: "UPDATE",
    actorId: session.user.id,
    newValue: data,
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

