"use client";

import { useRouter } from "next/navigation";

import {
  buildBacklogListHref,
  featurePriorityBands,
  isFeaturePriorityBand,
  priorityBandLabel,
} from "@/lib/backlog";
import { selectClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

export function BacklogPriorityFilter({
  priority,
  status,
  projectId,
}: {
  priority?: string;
  status?: string;
  projectId?: string;
}) {
  const router = useRouter();
  const value =
    priority && isFeaturePriorityBand(priority) ? priority : "";

  return (
    <select
      className={cn(selectClassName, "h-8 w-full max-w-xs text-sm")}
      value={value}
      aria-label="Filter by priority"
      onChange={(e) => {
        const next = e.target.value;
        router.push(
          buildBacklogListHref({
            status,
            projectId,
            priority: next || undefined,
          }),
        );
      }}
    >
      <option value="">All priorities</option>
      {featurePriorityBands.map((band) => (
        <option key={band} value={band}>
          {priorityBandLabel(band)}
        </option>
      ))}
    </select>
  );
}
