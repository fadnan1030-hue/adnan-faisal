import { prisma } from "@/lib/prisma";

export async function getConfigOptions(projectId: string, category: string) {
  return prisma.configOption.findMany({
    where: {
      category,
      active: true,
      OR: [{ projectId }, { projectId: null }],
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export const CONFIG_CATEGORIES = [
  "AREA",
  "UNIT",
  "DISCIPLINE",
  "WORK_CENTER",
  "EQUIPMENT_TYPE",
  "PM_FREQUENCY",
  "FINDING_CATEGORY",
  "HSE_OBSERVATION_CATEGORY",
  "QC_INSPECTION_TYPE",
  "NCR_CATEGORY",
] as const;

export type ConfigCategory = (typeof CONFIG_CATEGORIES)[number];
