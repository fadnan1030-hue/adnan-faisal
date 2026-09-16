import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type AccessLevel, type Module } from "@/lib/rbac";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireModuleAccess(module: Module, level: AccessLevel = "read") {
  const session = await requireSession();
  if (!can(session.user.role, module, level)) redirect("/unauthorized");
  return session;
}
