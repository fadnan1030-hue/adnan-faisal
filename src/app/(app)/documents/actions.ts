"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { resolveEquipmentTag } from "@/lib/equipment-lookup";
import { saveUploadedFile } from "@/lib/file-storage";
import { redirectWithError, optStr } from "@/lib/action-helpers";
import type { DocumentEntity } from "@prisma/client";

export async function uploadDocument(formData: FormData) {
  const session = await requireModuleAccess("DOCUMENTS", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/documents", "Select a project first.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirectWithError("/documents", "Please choose a file to upload.");
  }

  const equipmentId = await resolveEquipmentTag(projectId!, optStr(formData, "equipmentTag"), "/documents");
  const entityType = (optStr(formData, "entityType") as DocumentEntity) ?? "EQUIPMENT";

  const saved = await saveUploadedFile(file as File, "documents");

  const document = await prisma.document.create({
    data: {
      projectId: projectId!,
      entityType,
      fileName: saved.fileName,
      fileType: saved.fileType,
      fileSize: saved.fileSize,
      filePath: saved.filePath,
      uploadedById: session.user.id,
      equipmentId,
    },
  });

  await writeAuditLog({
    projectId,
    entityType: "DOCUMENT",
    entityId: document.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: document,
  });

  revalidatePath("/documents");
  redirect("/documents");
}
