import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink-strong focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-surface-muted disabled:text-ink-faint";

export const buttonPrimaryClass =
  "inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60";

export const buttonSecondaryClass =
  "inline-flex items-center justify-center rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted";

export const buttonDangerClass =
  "inline-flex items-center justify-center rounded-md border border-red-300 bg-surface px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950";

export function Field({
  label,
  htmlFor,
  required,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
      {message}
    </p>
  );
}
