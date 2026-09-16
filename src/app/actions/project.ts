"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_PROJECT_COOKIE } from "@/lib/current-project";

export async function setCurrentProject(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  if (!projectId) return;

  const store = await cookies();
  store.set(CURRENT_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(returnTo);
}
