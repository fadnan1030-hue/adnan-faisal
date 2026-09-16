import { Field, FormError, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/form";
import { toInputDate } from "@/lib/format";
import { getConfigOptions } from "@/lib/config-options";
import Link from "next/link";
import type { Equipment } from "@prisma/client";

const CRITICALITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["OPERATIONAL", "STANDBY", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "DECOMMISSIONED"];

export async function EquipmentForm({
  projectId,
  equipment,
  action,
  error,
}: {
  projectId: string;
  equipment?: Equipment;
  action: (formData: FormData) => void;
  error?: string;
}) {
  const [areas, units, disciplines, types] = await Promise.all([
    getConfigOptions(projectId, "AREA"),
    getConfigOptions(projectId, "UNIT"),
    getConfigOptions(projectId, "DISCIPLINE"),
    getConfigOptions(projectId, "EQUIPMENT_TYPE"),
  ]);

  return (
    <form action={action} className="max-w-4xl space-y-6">
      {equipment && <input type="hidden" name="id" value={equipment.id} />}
      <FormError message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Equipment Tag Number" htmlFor="tagNumber" required>
          <input
            id="tagNumber"
            name="tagNumber"
            defaultValue={equipment?.tagNumber}
            disabled={!!equipment}
            required
            placeholder="A31-PSV-715CX"
            className={inputClass}
          />
        </Field>
        <Field label="Description" htmlFor="description" required>
          <input
            id="description"
            name="description"
            defaultValue={equipment?.description}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Equipment Type" htmlFor="equipmentType">
          <input
            list="equipmentTypes"
            id="equipmentType"
            name="equipmentType"
            defaultValue={equipment?.equipmentType ?? ""}
            className={inputClass}
          />
          <datalist id="equipmentTypes">
            {types.map((t) => (
              <option key={t.id} value={t.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Equipment Category" htmlFor="equipmentCategory">
          <input
            id="equipmentCategory"
            name="equipmentCategory"
            defaultValue={equipment?.equipmentCategory ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Area" htmlFor="area">
          <input list="areas" id="area" name="area" defaultValue={equipment?.area ?? ""} className={inputClass} />
          <datalist id="areas">
            {areas.map((a) => (
              <option key={a.id} value={a.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Unit" htmlFor="unit">
          <input list="units" id="unit" name="unit" defaultValue={equipment?.unit ?? ""} className={inputClass} />
          <datalist id="units">
            {units.map((u) => (
              <option key={u.id} value={u.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={equipment?.location ?? ""} className={inputClass} />
        </Field>
        <Field label="System" htmlFor="system">
          <input id="system" name="system" defaultValue={equipment?.system ?? ""} className={inputClass} />
        </Field>
        <Field label="Subsystem" htmlFor="subsystem">
          <input id="subsystem" name="subsystem" defaultValue={equipment?.subsystem ?? ""} className={inputClass} />
        </Field>
        <Field label="Manufacturer" htmlFor="manufacturer">
          <input
            id="manufacturer"
            name="manufacturer"
            defaultValue={equipment?.manufacturer ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Model" htmlFor="model">
          <input id="model" name="model" defaultValue={equipment?.model ?? ""} className={inputClass} />
        </Field>
        <Field label="Serial Number" htmlFor="serialNumber">
          <input
            id="serialNumber"
            name="serialNumber"
            defaultValue={equipment?.serialNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Criticality" htmlFor="criticality">
          <select id="criticality" name="criticality" defaultValue={equipment?.criticality ?? "MEDIUM"} className={inputClass}>
            {CRITICALITY.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ABC Indicator" htmlFor="abcIndicator">
          <input
            id="abcIndicator"
            name="abcIndicator"
            defaultValue={equipment?.abcIndicator ?? ""}
            placeholder="A / B / C"
            className={inputClass}
          />
        </Field>
        <Field label="Discipline" htmlFor="discipline">
          <input
            list="disciplines"
            id="discipline"
            name="discipline"
            defaultValue={equipment?.discipline ?? ""}
            className={inputClass}
          />
          <datalist id="disciplines">
            {disciplines.map((d) => (
              <option key={d.id} value={d.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Responsible Team" htmlFor="responsibleTeam">
          <input
            id="responsibleTeam"
            name="responsibleTeam"
            defaultValue={equipment?.responsibleTeam ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Maintenance Strategy" htmlFor="maintenanceStrategy">
          <input
            id="maintenanceStrategy"
            name="maintenanceStrategy"
            defaultValue={equipment?.maintenanceStrategy ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="PM Frequency" htmlFor="pmFrequency">
          <input
            id="pmFrequency"
            name="pmFrequency"
            defaultValue={equipment?.pmFrequency ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Installation Date" htmlFor="installationDate">
          <input
            type="date"
            id="installationDate"
            name="installationDate"
            defaultValue={toInputDate(equipment?.installationDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Commissioning Date" htmlFor="commissioningDate">
          <input
            type="date"
            id="commissioningDate"
            name="commissioningDate"
            defaultValue={toInputDate(equipment?.commissioningDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Operational Status" htmlFor="operationalStatus">
          <select
            id="operationalStatus"
            name="operationalStatus"
            defaultValue={equipment?.operationalStatus ?? "OPERATIONAL"}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-4 rounded-md border border-line bg-surface-muted p-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="isSce" defaultChecked={equipment?.isSce} className="h-4 w-4" />
          Safety Critical Equipment (SCE)
        </label>
        <input
          name="sceCategory"
          defaultValue={equipment?.sceCategory ?? ""}
          placeholder="SCE category (e.g. Category 1 - Pressure Protection)"
          className={`${inputClass} max-w-sm`}
        />
      </div>

      {equipment && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="active" defaultChecked={equipment.active} className="h-4 w-4" />
          Active
        </label>
      )}

      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" defaultValue={equipment?.notes ?? ""} rows={3} className={inputClass} />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimaryClass}>
          {equipment ? "Save Changes" : "Create Equipment"}
        </button>
        <Link href={equipment ? `/equipment/${equipment.id}` : "/equipment"} className={buttonSecondaryClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
