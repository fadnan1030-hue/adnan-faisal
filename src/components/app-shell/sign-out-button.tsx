"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-muted"
    >
      Sign out
    </button>
  );
}
