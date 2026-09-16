import { prisma } from "@/lib/prisma";
import { redirectWithError } from "@/lib/action-helpers";

/** Resolve a free-typed equipment tag to its id, scoped to the current project. */
export async function resolveEquipmentTag(
  projectId: string,
  tag: string | undefined,
  errorRedirectPath: string
): Promise<string | undefined> {
  if (!tag) return undefined;

  const equipment = await prisma.equipment.findUnique({
    where: { projectId_tagNumber: { projectId, tagNumber: tag } },
  });

  if (!equipment) {
    redirectWithError(errorRedirectPath, `Equipment tag "${tag}" was not found in this project.`);
  }

  return equipment!.id;
}

export async function listEquipmentTags(projectId: string) {
  return prisma.equipment.findMany({
    where: { projectId, active: true },
    select: { id: true, tagNumber: true, description: true },
    orderBy: { tagNumber: "asc" },
  });
}
