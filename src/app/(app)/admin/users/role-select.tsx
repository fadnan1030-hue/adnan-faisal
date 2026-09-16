"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/form";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/rbac";
import { updateUserRole } from "./actions";

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateUserRole} className="flex items-center gap-1">
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        defaultValue={role}
        onChange={() => formRef.current?.requestSubmit()}
        className={`${inputClass} text-xs`}
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
