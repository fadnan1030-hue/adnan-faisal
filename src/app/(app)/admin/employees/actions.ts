"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str, optStr } from "@/lib/action-helpers";

export async function createContractor(formData: FormData) {
  await requireModuleAccess("ADMINISTRATION", "write");
  const projectId = await getCurrentProjectId();
  const name = str(formData, "name");
  if (!projectId || !name) redirectWithError("/admin/employees", "Contractor name is required.");

  await prisma.contractor.upsert({
    where: { projectId_name: { projectId: projectId!, name } },
    update: {},
    create: { projectId: projectId!, name, contactName: optStr(formData, "contactName"), contactEmail: optStr(formData, "contactEmail") },
  });

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

export async function createEmployee(formData: FormData) {
  await requireModuleAccess("ADMINISTRATION", "write");
  const projectId = await getCurrentProjectId();
  const employeeNumber = str(formData, "employeeNumber");
  const name = str(formData, "name");
  if (!projectId || !employeeNumber || !name) {
    redirectWithError("/admin/employees", "Employee number and name are required.");
  }

  const existing = await prisma.employee.findUnique({
    where: { projectId_employeeNumber: { projectId: projectId!, employeeNumber } },
  });
  if (existing) redirectWithError("/admin/employees", `Employee number "${employeeNumber}" already exists.`);

  await prisma.employee.create({
    data: {
      projectId: projectId!,
      employeeNumber,
      name,
      craft: optStr(formData, "craft"),
      discipline: optStr(formData, "discipline"),
      contractorId: optStr(formData, "contractorId"),
    },
  });

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}
