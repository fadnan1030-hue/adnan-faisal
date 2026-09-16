import { prisma } from "@/lib/prisma";
import type { Equipment } from "@prisma/client";

/** Keep SceRecord in sync with Equipment.isSce (spec sections 17 & 22). */
export async function ensureSceRecord(equipment: Equipment) {
  if (!equipment.isSce) return;

  const existing = await prisma.sceRecord.findUnique({ where: { equipmentId: equipment.id } });
  if (existing) return;

  await prisma.sceRecord.create({
    data: {
      projectId: equipment.projectId,
      equipmentId: equipment.id,
      sceCategory: equipment.sceCategory ?? "Uncategorized",
      status: "DUE",
    },
  });
}
