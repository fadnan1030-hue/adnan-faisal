import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      <table className="min-w-full divide-y divide-line text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-muted">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line-soft">{children}</tbody>;
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2 text-ink ${className ?? ""}`}>{children}</td>;
}

export function EmptyRow({ colSpan, message = "No records found." }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-ink-faint">
        {message}
      </td>
    </tr>
  );
}
