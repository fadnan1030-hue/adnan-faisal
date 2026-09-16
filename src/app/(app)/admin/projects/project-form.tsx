import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { toInputDate } from "@/lib/format";
import Link from "next/link";
import type { Project } from "@prisma/client";

const STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CLOSED"];

export function ProjectForm({
  project,
  action,
  error,
}: {
  project?: Project;
  action: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Project Code" htmlFor="code" required>
          <input
            id="code"
            name="code"
            defaultValue={project?.code}
            disabled={!!project}
            required
            placeholder="OQ-AP-2026"
            className={inputClass}
          />
        </Field>
        <Field label="Project Name" htmlFor="name" required>
          <input id="name" name="name" defaultValue={project?.name} required className={inputClass} />
        </Field>
        <Field label="Client" htmlFor="client">
          <input id="client" name="client" defaultValue={project?.client ?? ""} className={inputClass} />
        </Field>
        <Field label="Contractor" htmlFor="contractor">
          <input
            id="contractor"
            name="contractor"
            defaultValue={project?.contractor ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Contract Number" htmlFor="contractNumber">
          <input
            id="contractNumber"
            name="contractNumber"
            defaultValue={project?.contractNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={project?.location ?? ""} className={inputClass} />
        </Field>
        <Field label="Project Manager" htmlFor="projectManager">
          <input
            id="projectManager"
            name="projectManager"
            defaultValue={project?.projectManager ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={project?.status ?? "ACTIVE"} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start Date" htmlFor="startDate">
          <input
            type="date"
            id="startDate"
            name="startDate"
            defaultValue={toInputDate(project?.startDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Planned Completion Date" htmlFor="plannedCompletionDate">
          <input
            type="date"
            id="plannedCompletionDate"
            name="plannedCompletionDate"
            defaultValue={toInputDate(project?.plannedCompletionDate)}
            className={inputClass}
          />
        </Field>
        {project && (
          <Field label="Actual Completion Date" htmlFor="actualCompletionDate">
            <input
              type="date"
              id="actualCompletionDate"
              name="actualCompletionDate"
              defaultValue={toInputDate(project?.actualCompletionDate)}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="LTI-Free Start Date" htmlFor="ltiFreeStartDate" hint="Used by the LTI-free man-hour counter.">
          <input
            type="date"
            id="ltiFreeStartDate"
            name="ltiFreeStartDate"
            defaultValue={toInputDate(project?.ltiFreeStartDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Current Reporting Period" htmlFor="currentPeriodLabel">
          <input
            id="currentPeriodLabel"
            name="currentPeriodLabel"
            defaultValue={project?.currentPeriodLabel ?? ""}
            placeholder="Aug-2026"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          {project ? "Save Changes" : "Create Project"}
        </button>
        <Link href="/admin/projects" className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
