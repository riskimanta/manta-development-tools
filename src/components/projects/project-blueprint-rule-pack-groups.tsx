"use client";

import { Button } from "@/components/ui/button";
import {
  getRecommendedRulePacks,
  getAllAutomationRulePacks,
  clearOptionalAutomationPacks,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  RULE_PACK_GROUPS,
  type ProjectBlueprintRulePack,
  type ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";

type ProjectBlueprintRulePackGroupsProps = {
  rulePacks: ProjectBlueprintRulePack[];
  stackProfile: ProjectBlueprintStackProfile;
  onRulePacksChange: (rulePacks: ProjectBlueprintRulePack[]) => void;
  onResetDefaults: () => void;
  onManualChange?: () => void;
};

export function ProjectBlueprintRulePackGroups({
  rulePacks,
  stackProfile,
  onRulePacksChange,
  onResetDefaults,
  onManualChange,
}: ProjectBlueprintRulePackGroupsProps) {
  function toggleRulePack(pack: ProjectBlueprintRulePack, checked: boolean) {
    onManualChange?.();
    if (checked) {
      onRulePacksChange(rulePacks.includes(pack) ? rulePacks : [...rulePacks, pack]);
      return;
    }
    onRulePacksChange(rulePacks.filter((value) => value !== pack));
  }

  function handleSelectRecommended() {
    onManualChange?.();
    onRulePacksChange(getRecommendedRulePacks(stackProfile));
  }

  function handleSelectAllAutomation() {
    onManualChange?.();
    const automation = getAllAutomationRulePacks();
    const merged = new Set([...rulePacks, ...automation]);
    onRulePacksChange(Array.from(merged));
  }

  function handleResetDefaults() {
    onManualChange?.();
    onResetDefaults();
  }

  function handleClearOptional() {
    onManualChange?.();
    onRulePacksChange(clearOptionalAutomationPacks(rulePacks));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectRecommended}
        >
          Select recommended
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAllAutomation}
        >
          Select all automation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetDefaults}
        >
          Reset defaults
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearOptional}
        >
          Clear optional
        </Button>
      </div>

      <div className="space-y-4">
        {RULE_PACK_GROUPS.map((group) => (
          <fieldset key={group.id} className="min-w-0 space-y-2">
            <legend className="text-sm font-medium">{group.label}</legend>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {group.packs.map((pack) => (
                <label
                  key={pack}
                  className="flex min-w-0 items-start gap-2 text-xs leading-snug"
                >
                  <input
                    type="checkbox"
                    checked={rulePacks.includes(pack)}
                    onChange={(event) =>
                      toggleRulePack(pack, event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
                  />
                  <span className="break-words">
                    {PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
