import { Field, inputClass } from "@/components/ui/form";
import { listEquipmentTags } from "@/lib/equipment-lookup";

export async function EquipmentTagField({
  projectId,
  defaultValue,
  required,
}: {
  projectId: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const equipment = await listEquipmentTags(projectId);

  return (
    <Field label="Equipment Tag" htmlFor="equipmentTag" required={required} hint="Type to search by tag number.">
      <input
        list="equipment-tags"
        id="equipmentTag"
        name="equipmentTag"
        defaultValue={defaultValue}
        required={required}
        placeholder="A31-PSV-715CX"
        className={inputClass}
      />
      <datalist id="equipment-tags">
        {equipment.map((e) => (
          <option key={e.id} value={e.tagNumber}>
            {e.description}
          </option>
        ))}
      </datalist>
    </Field>
  );
}
