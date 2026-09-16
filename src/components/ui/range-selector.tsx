"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/form";

export function RangeSelector({ tab, range }: { tab: string; range?: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} className="pb-2">
      <input type="hidden" name="tab" value={tab} />
      <select
        name="range"
        defaultValue={range ?? "all"}
        onChange={() => formRef.current?.requestSubmit()}
        className={`${inputClass} text-xs`}
      >
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="365">Last 12 months</option>
        <option value="all">All history</option>
      </select>
    </form>
  );
}
