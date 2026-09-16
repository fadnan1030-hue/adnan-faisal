import Link from "next/link";
import clsx from "clsx";

export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "good" | "warning" | "critical";
  href?: string;
}) {
  const toneClass = {
    default: "text-ink-strong",
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
  }[tone];

  const content = (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={clsx("mt-2 text-2xl font-semibold", toneClass)}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-muted">{sublabel}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
