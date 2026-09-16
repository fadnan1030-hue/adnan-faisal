import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-muted px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        ⛔
      </div>
      <h1 className="text-lg font-semibold text-ink-strong">Access restricted</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Your role does not have permission to view this module. Contact your administrator if
        you believe this is a mistake.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
