import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";

const REPORTS = [
  { href: "/reports/monthly?period=MONTHLY", label: "Monthly Management Report", description: "Executive KPI summary, maintenance, HSE, SCE, QC, findings and actions (spec section 38)." },
  { href: "/reports/monthly?period=WEEKLY", label: "Weekly Report", description: "Same layout, scoped to the current week." },
  { href: "/equipment", label: "Equipment Report", description: "Open an equipment record and use its History tab, or export via Excel." },
];

export default async function ReportsPage() {
  await requireModuleAccess("REPORTS", "read");

  return (
    <div>
      <PageHeader title="Reports" description="Spec sections 38-39 — printable management reports (use your browser's Print → Save as PDF)." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="rounded-xl border border-line bg-surface p-4 shadow-sm hover:shadow-md">
            <h3 className="text-sm font-semibold text-ink-strong">{r.label}</h3>
            <p className="mt-1 text-xs text-ink-muted">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
