"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { redirectWithError, str, optStr, optDate } from "@/lib/action-helpers";
import type { ProjectStatus } from "@prisma/client";

export async function createProject(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");

  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!code || !name) {
    redirectWithError("/admin/projects/new", "Project code and name are required.");
  }

  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) {
    redirectWithError("/admin/projects/new", `Project code "${code}" is already in use.`);
  }

  const project = await prisma.project.create({
    data: {
      code,
      name,
      client: optStr(formData, "client"),
      contractor: optStr(formData, "contractor"),
      contractNumber: optStr(formData, "contractNumber"),
      location: optStr(formData, "location"),
      projectManager: optStr(formData, "projectManager"),
      status: (optStr(formData, "status") as ProjectStatus) ?? "ACTIVE",
      startDate: optDate(formData, "startDate"),
      plannedCompletionDate: optDate(formData, "plannedCompletionDate"),
      ltiFreeStartDate: optDate(formData, "ltiFreeStartDate"),
      currentPeriodLabel: optStr(formData, "currentPeriodLabel"),
    },
  });

  await writeAuditLog({
    projectId: project.id,
    entityType: "PROJECT",
    entityId: project.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: project,
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const id = str(formData, "id");
  const before = await prisma.project.findUniqueOrThrow({ where: { id } });

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: str(formData, "name") || before.name,
      client: optStr(formData, "client"),
      contractor: optStr(formData, "contractor"),
      contractNumber: optStr(formData, "contractNumber"),
      location: optStr(formData, "location"),
      projectManager: optStr(formData, "projectManager"),
      status: (optStr(formData, "status") as ProjectStatus) ?? before.status,
      startDate: optDate(formData, "startDate"),
      plannedCompletionDate: optDate(formData, "plannedCompletionDate"),
      actualCompletionDate: optDate(formData, "actualCompletionDate"),
      ltiFreeStartDate: optDate(formData, "ltiFreeStartDate"),
      currentPeriodLabel: optStr(formData, "currentPeriodLabel"),
    },
  });

  await writeAuditLog({
    projectId: project.id,
    entityType: "PROJECT",
    entityId: project.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: before,
    newValue: project,
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
