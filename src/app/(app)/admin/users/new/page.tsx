import { requireModuleAccess } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/rbac";
import Link from "next/link";
import { createUser } from "../actions";

export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireModuleAccess("ADMINISTRATION", "write");
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title="New User" />
      <form action={createUser} className="max-w-md space-y-4">
        <FormError message={error} />
        <Field label="Name" htmlFor="name" required>
          <input id="name" name="name" required className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <input type="email" id="email" name="email" required className={inputClass} />
        </Field>
        <Field label="Password" htmlFor="password" required hint="At least 8 characters.">
          <input type="password" id="password" name="password" required minLength={8} className={inputClass} />
        </Field>
        <Field label="Role" htmlFor="role" required>
          <select id="role" name="role" defaultValue="TECHNICIAN" className={inputClass}>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Create User
          </button>
          <Link href="/admin/users" className={buttonSecondaryClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
