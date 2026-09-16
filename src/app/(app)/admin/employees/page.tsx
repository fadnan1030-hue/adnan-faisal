import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { inputClass, buttonPrimaryClass } from "@/components/ui/form";
import { createContractor, createEmployee } from "./actions";

export default async function EmployeesPage() {
  await requireModuleAccess("ADMINISTRATION", "write");
  const projectId = await getCurrentProjectId();

  const [contractors, employees] = projectId
    ? await Promise.all([
        prisma.contractor.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
        prisma.employee.findMany({ where: { projectId }, include: { contractor: true }, orderBy: { name: "asc" } }),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader title="Contractors &amp; Employees" description="Spec sections 6, 31." />

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-ink">Contractors</h2>
        <form action={createContractor} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
            <input name="name" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Contact Name</label>
            <input name="contactName" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Contact Email</label>
            <input type="email" name="contactEmail" className={inputClass} />
          </div>
          <button type="submit" className={buttonPrimaryClass}>
            Add Contractor
          </button>
        </form>
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <TBody>
            {contractors.length === 0 && <EmptyRow colSpan={3} />}
            {contractors.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium text-ink-strong">{c.name}</Td>
                <Td>{c.contactName ?? "—"} {c.contactEmail ? `· ${c.contactEmail}` : ""}</Td>
                <Td>
                  <StatusBadge status={c.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Employees</h2>
        <form action={createEmployee} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Employee #</label>
            <input name="employeeNumber" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
            <input name="name" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Craft</label>
            <input name="craft" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Contractor</label>
            <select name="contractorId" className={inputClass}>
              <option value="">—</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonPrimaryClass}>
            Add Employee
          </button>
        </form>
        <Table>
          <THead>
            <tr>
              <Th>Employee #</Th>
              <Th>Name</Th>
              <Th>Craft</Th>
              <Th>Contractor</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <TBody>
            {employees.length === 0 && <EmptyRow colSpan={5} />}
            {employees.map((e) => (
              <tr key={e.id}>
                <Td>{e.employeeNumber}</Td>
                <Td className="font-medium text-ink-strong">{e.name}</Td>
                <Td>{e.craft ?? "—"}</Td>
                <Td>{e.contractor?.name ?? "—"}</Td>
                <Td>
                  <StatusBadge status={e.active ? "ACTIVE" : "INACTIVE"} />
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
