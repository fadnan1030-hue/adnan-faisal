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
    default: "text-slate-900",
    good: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-red-600",
  }[tone];

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-2xl font-semibold", toneClass)}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
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
