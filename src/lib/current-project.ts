import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "currentProjectId";

export async function getCurrentProject() {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;

  if (id) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (project) return project;
  }

  return prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function getCurrentProjectId() {
  const project = await getCurrentProject();
  return project?.id ?? null;
}

export const CURRENT_PROJECT_COOKIE = COOKIE_NAME;
