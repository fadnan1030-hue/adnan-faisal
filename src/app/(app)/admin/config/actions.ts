"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { redirectWithError, str } from "@/lib/action-helpers";

export async function addConfigOption(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const projectId = await getCurrentProjectId();
  const category = str(formData, "category");
  const code = str(formData, "code");
  const label = str(formData, "label");
  if (!projectId || !category || !code || !label) {
    redirectWithError(`/admin/config?category=${category}`, "Code and label are required.");
  }

  const existing = await prisma.configOption.findUnique({
    where: { projectId_category_code: { projectId: projectId!, category, code } },
  });
  if (existing) {
    redirectWithError(`/admin/config?category=${category}`, `Code "${code}" already exists in this category.`);
  }

  const option = await prisma.configOption.create({
    data: { projectId: projectId!, category, code, label },
  });

  await writeAuditLog({
    projectId,
    entityType: "PROJECT",
    entityId: option.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: option,
  });

  revalidatePath("/admin/config");
  redirect(`/admin/config?category=${category}`);
}

export async function toggleConfigOption(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const id = str(formData, "id");
  const category = str(formData, "category");
  const option = await prisma.configOption.findUniqueOrThrow({ where: { id } });

  const updated = await prisma.configOption.update({
    where: { id },
    data: { active: !option.active },
  });

  await writeAuditLog({
    projectId: option.projectId,
    entityType: "PROJECT",
    entityId: option.id,
    action: "UPDATE",
    actorId: session.user.id,
    previousValue: option,
    newValue: updated,
  });

  revalidatePath("/admin/config");
  redirect(`/admin/config?category=${category}`);
}
