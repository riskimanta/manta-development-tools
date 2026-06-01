"use client";

import { useRouter } from "next/navigation";

import {
  buildProjectFilterListHref,
  type ProjectFilterListTarget,
} from "@/lib/project-filter-href";
import { selectClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

type ProjectOption = { id: string; name: string; slug: string };

export function FeatureProjectFilter({
  projects,
  projectId,
  status,
  priority,
  listTarget = "features",
  ariaLabel = "Filter by project",
}: {
  projects: ProjectOption[];
  projectId?: string;
  status?: string;
  priority?: string;
  listTarget?: ProjectFilterListTarget;
  ariaLabel?: string;
}) {
  const router = useRouter();

  return (
    <select
      className={cn(selectClassName, "h-8 w-full max-w-xs text-sm")}
      value={projectId ?? ""}
      aria-label={ariaLabel}
      onChange={(e) => {
        const nextProjectId = e.target.value || undefined;
        router.push(
          buildProjectFilterListHref(listTarget, {
            status,
            projectId: nextProjectId,
            priority,
          }),
        );
      }}
    >
      <option value="">All projects</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} · {p.slug}
        </option>
      ))}
    </select>
  );
}
