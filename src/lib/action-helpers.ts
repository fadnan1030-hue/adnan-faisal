import { redirect } from "next/navigation";

/** Redirect back to a form page carrying a human-readable error in the query string. */
export function redirectWithError(path: string, message: string): never {
  const url = new URL(path, "http://internal");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function optStr(formData: FormData, key: string): string | undefined {
  const v = str(formData, key);
  return v === "" ? undefined : v;
}

export function optDate(formData: FormData, key: string): Date | undefined {
  const v = str(formData, key);
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function optDecimal(formData: FormData, key: string): number | undefined {
  const v = str(formData, key);
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
