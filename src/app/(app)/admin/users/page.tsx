import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { toggleUserActive } from "./actions";
import { RoleSelect } from "./role-select";

export default async function UsersPage() {
  await requireModuleAccess("ADMINISTRATION", "write");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Spec section 5 — role-based access control."
        actions={
          <Link href="/admin/users/new" className={buttonPrimaryClass}>
            + New User
          </Link>
        }
      />

      <Table>
        <THead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </THead>
        <TBody>
          {users.length === 0 && <EmptyRow colSpan={5} />}
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium text-ink-strong">{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>
                <RoleSelect userId={u.id} role={u.role} />
              </Td>
              <Td>
                <StatusBadge status={u.active ? "ACTIVE" : "INACTIVE"} />
              </Td>
              <Td>
                <form action={toggleUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <button type="submit" className={buttonSecondaryClass}>
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
