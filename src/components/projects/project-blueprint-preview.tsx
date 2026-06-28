"use client";

import { useMemo } from "react";

import { buildBlueprintPreviewSummary } from "@/lib/project-blueprint-preview";
import {
  FULL_AUTOPILOT_RECOMMENDED_PACKS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  type ProjectBlueprintInput,
} from "@/lib/project-blueprint-types";

type ProjectBlueprintPreviewProps = {
  input: ProjectBlueprintInput;
};

export function ProjectBlueprintPreview({ input }: ProjectBlueprintPreviewProps) {
  const summary = useMemo(() => buildBlueprintPreviewSummary(input), [input]);

  return (
    <div className="space-y-3 rounded-md border border-border bg-background/60 p-3">
      <p className="text-sm font-medium">Prompt preview summary</p>
      <dl className="grid gap-1.5 text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Project type:</dt>
          <dd>{summary.projectTypeLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Stack profile:</dt>
          <dd>{summary.stackProfileLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Architecture style:</dt>
          <dd>{summary.architectureStyleLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Automation level:</dt>
          <dd>{summary.automationLevelLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Rule packs:</dt>
          <dd>{summary.rulePackCount} selected</dd>
        </div>
      </dl>

      {summary.automationPacks.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Automation-focused packs
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {summary.automationPacks.map((pack) => (
              <li key={pack} className="break-words">
                {pack}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {input.automationLevel === "full-autopilot" ? (
        <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          <p>
            Full Autopilot is advanced. Consider enabling these recommended packs
            before copying the prompt:
          </p>
          <ul className="list-inside list-disc">
            {FULL_AUTOPILOT_RECOMMENDED_PACKS.map((pack) => (
              <li key={pack}>{PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.warnings.map((warning) => (
        <p
          key={warning}
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100"
        >
          {warning}
        </p>
      ))}
    </div>
  );
}
