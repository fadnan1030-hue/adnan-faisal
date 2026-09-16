"use client";

import { useRef } from "react";
import { setCurrentProject } from "@/app/actions/project";

export function ProjectSelector({
  projects,
  currentProjectId,
}: {
  projects: { id: string; code: string; name: string }[];
  currentProjectId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setCurrentProject} className="flex items-center gap-2">
      <input type="hidden" name="returnTo" value="/dashboard" />
      <label className="text-xs font-medium text-ink-muted">Project</label>
      <select
        name="projectId"
        defaultValue={currentProjectId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-line-strong bg-surface px-2 py-1 text-sm text-ink-strong focus:border-indigo-500 focus:outline-none"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name}
          </option>
        ))}
      </select>
    </form>
  );
}
