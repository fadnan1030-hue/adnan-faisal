"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { redirectWithError, str } from "@/lib/action-helpers";
import type { Role } from "@/lib/rbac";

export async function createUser(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const role = str(formData, "role") as Role;

  if (!name || !email || !password || password.length < 8) {
    redirectWithError("/admin/users/new", "Name, email and a password of at least 8 characters are required.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirectWithError("/admin/users/new", `A user with email "${email}" already exists.`);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "CREATE",
    actorId: session.user.id,
    newValue: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const id = str(formData, "id");
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });

  const updated = await prisma.user.update({ where: { id }, data: { active: !user.active } });

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "PERMISSION_CHANGE",
    actorId: session.user.id,
    previousValue: { active: user.active },
    newValue: { active: updated.active },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  const session = await requireModuleAccess("ADMINISTRATION", "write");
  const id = str(formData, "id");
  const role = str(formData, "role") as Role;
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });

  const updated = await prisma.user.update({ where: { id }, data: { role } });

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "PERMISSION_CHANGE",
    actorId: session.user.id,
    previousValue: { role: user.role },
    newValue: { role: updated.role },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
