"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Copy, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import {
  createProject,
  detectProjectMetadataAction,
  type ActionState,
} from "@/app/projects/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { ProjectBlueprintPreview } from "@/components/projects/project-blueprint-preview";
import { ProjectBlueprintRulePackGroups } from "@/components/projects/project-blueprint-rule-pack-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectClassName, textareaClassName } from "@/lib/form-classes";
import {
  applyBlueprintPreset,
  BLUEPRINT_PRESETS,
  type BlueprintPresetId,
} from "@/lib/project-blueprint-presets";
import { buildProjectBlueprintPrompt } from "@/lib/project-blueprint-prompt";
import {
  DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
  getDefaultRulePacksForStack,
  getResetBlueprintDefaults,
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLES,
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG,
  PROJECT_BLUEPRINT_AUTOMATION_LEVELS,
  PROJECT_BLUEPRINT_PROJECT_TYPES,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILES,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
  type ProjectBlueprintArchitectureStyle,
  type ProjectBlueprintAutomationLevel,
  type ProjectBlueprintProjectType,
  type ProjectBlueprintRulePack,
  type ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";
import { buildProjectSetupPrompt } from "@/lib/project-setup-prompt";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PROJECT_ONBOARDING_MODE,
  getProjectOnboardingUiConfig,
  type ProjectOnboardingMode,
} from "@/components/projects/project-create-form-onboarding";

const initialState: ActionState | undefined = undefined;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ProjectCreateForm() {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  const [detecting, startDetectTransition] = useTransition();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [localPath, setLocalPath] = useState("");

  const [projectType, setProjectType] =
    useState<ProjectBlueprintProjectType>("fullstack-app");
  const [stackProfile, setStackProfile] =
    useState<ProjectBlueprintStackProfile>("nextjs-prisma-sqlite");
  const [architectureStyle, setArchitectureStyle] =
    useState<ProjectBlueprintArchitectureStyle>("feature-based");
  const [automationLevel, setAutomationLevel] =
    useState<ProjectBlueprintAutomationLevel>(
      DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
    );
  const [rulePacks, setRulePacks] = useState<ProjectBlueprintRulePack[]>(() =>
    getDefaultRulePacksForStack("nextjs-prisma-sqlite"),
  );
  const [customNotes, setCustomNotes] = useState("");
  const [onboardingMode, setOnboardingMode] = useState<ProjectOnboardingMode>(
    DEFAULT_PROJECT_ONBOARDING_MODE,
  );
  const [hasCopiedBlueprintPrompt, setHasCopiedBlueprintPrompt] = useState(false);
  const [activePresetId, setActivePresetId] = useState<BlueprintPresetId | null>(
    "balanced-recommended",
  );

  const blueprintInput = useMemo(
    () => ({
      localPath: localPath.trim() || undefined,
      projectType,
      stackProfile,
      architectureStyle,
      automationLevel,
      rulePacks,
      customNotes: customNotes.trim() || undefined,
    }),
    [
      localPath,
      projectType,
      stackProfile,
      architectureStyle,
      automationLevel,
      rulePacks,
      customNotes,
    ],
  );

  const setupPrompt = useMemo(
    () => buildProjectSetupPrompt({ localPath: localPath.trim() || undefined }),
    [localPath],
  );

  const blueprintPrompt = useMemo(
    () => buildProjectBlueprintPrompt(blueprintInput),
    [blueprintInput],
  );

  function clearActivePreset() {
    setActivePresetId(null);
  }

  function applyPreset(presetId: BlueprintPresetId) {
    const result = applyBlueprintPreset(presetId, stackProfile);
    setActivePresetId(presetId);
    setAutomationLevel(result.automationLevel);
    setRulePacks(result.rulePacks);
    if (result.warnings?.length) {
      for (const warning of result.warnings) {
        toast.warning(warning);
      }
    }
  }

  function handleStackProfileChange(nextStack: ProjectBlueprintStackProfile) {
    setStackProfile(nextStack);
    if (activePresetId) {
      const result = applyBlueprintPreset(activePresetId, nextStack);
      setAutomationLevel(result.automationLevel);
      setRulePacks(result.rulePacks);
      return;
    }
    const reset = getResetBlueprintDefaults(nextStack);
    setAutomationLevel(reset.automationLevel);
    setRulePacks(reset.rulePacks);
  }

  function handleResetBlueprintDefaults() {
    clearActivePreset();
    const reset = getResetBlueprintDefaults(stackProfile);
    setAutomationLevel(reset.automationLevel);
    setRulePacks(reset.rulePacks);
  }

  function handleAutomationLevelChange(level: ProjectBlueprintAutomationLevel) {
    clearActivePreset();
    setAutomationLevel(level);
  }

  async function handleCopySetupPrompt() {
    const ok = await copyText(setupPrompt);
    if (ok) {
      toast.success("Project setup prompt copied.");
    } else {
      toast.error("Could not copy project setup prompt.");
    }
  }

  async function handleCopyBlueprintPrompt() {
    const ok = await copyText(blueprintPrompt);
    if (ok) {
      setHasCopiedBlueprintPrompt(true);
      toast.success("Blueprint prompt copied.");
    } else {
      toast.error("Unable to copy blueprint prompt.");
    }
  }

  function handleDetect() {
    const trimmedLocalPath = localPath.trim();
    if (!trimmedLocalPath) {
      toast.error("Enter a local path before detecting project details.");
      return;
    }

    startDetectTransition(async () => {
      const result = await detectProjectMetadataAction(trimmedLocalPath);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const { metadata } = result;
      if (metadata.name) {
        setName(metadata.name);
      }
      if (metadata.slug) {
        setSlug(metadata.slug);
      }
      if (metadata.description) {
        setDescription(metadata.description);
      }
      if (metadata.repositoryUrl) {
        setRepoUrl(metadata.repositoryUrl);
      }
      setLocalPath(metadata.localPath);

      if (metadata.blueprint) {
        const blueprint = metadata.blueprint;
        if (blueprint.projectType) {
          setProjectType(blueprint.projectType);
        }
        if (blueprint.stackProfile) {
          setStackProfile(blueprint.stackProfile);
        }
        if (blueprint.architectureStyle) {
          setArchitectureStyle(blueprint.architectureStyle);
        }
        if (blueprint.automationLevel) {
          setAutomationLevel(blueprint.automationLevel);
        }
        if (blueprint.rulePacks) {
          setRulePacks(blueprint.rulePacks);
        }
        if (blueprint.customNotes) {
          setCustomNotes(blueprint.customNotes);
        }
        setActivePresetId(null);
      }

      if (metadata.warnings.length > 0) {
        for (const warning of metadata.warnings) {
          toast.warning(warning);
        }
      }
      toast.success(result.message);
    });
  }

  const onboardingUi = getProjectOnboardingUiConfig(onboardingMode);

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-6">
      <FieldErrors errors={state?.fieldErrors} />
      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium">What are you starting with?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setOnboardingMode("existing-project")}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              onboardingMode === "existing-project"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40",
            )}
            aria-pressed={onboardingMode === "existing-project"}
          >
            <p className="text-sm font-medium">Existing project</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Register a folder that already contains project code.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setOnboardingMode("new-project")}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              onboardingMode === "new-project"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40",
            )}
            aria-pressed={onboardingMode === "new-project"}
          >
            <p className="text-sm font-medium">New project / empty folder</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prepare architecture, Cursor rules, and ManDev metadata from
              scratch.
            </p>
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
        <Label htmlFor="localPath">Local path</Label>
        <Input
          id="localPath"
          name="localPath"
          value={localPath}
          onChange={(event) => setLocalPath(event.target.value)}
          placeholder="/Users/you/Documents/my-app"
        />
        {onboardingUi.showExistingProjectHelper ? (
          <>
            <p className="text-xs text-muted-foreground">
              Start by detecting the project. If ManDev metadata is not
              available yet, prepare it with Cursor and detect the project
              again.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5"
                disabled={detecting || pending}
                onClick={handleDetect}
              >
                <ScanSearch className="size-4" />
                {detecting ? "Detecting…" : onboardingUi.detectButtonLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled={detecting || pending}
                onClick={handleCopySetupPrompt}
              >
                <Copy className="size-4" />
                {onboardingUi.setupButtonLabel}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {onboardingUi.showBlueprintConfiguration ? (
        <div className="min-w-0 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          {onboardingUi.showEmptyFolderNotice ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              Use this mode only for an empty folder or a project that has not
              been initialized.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Start a new project with ManDev metadata, Cursor rules, architecture
            notes, and run profiles. Paste the blueprint prompt into Cursor inside
            an empty or new project folder.
          </p>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="blueprint-project-type">Project type</Label>
              <select
                id="blueprint-project-type"
                value={projectType}
                onChange={(event) => {
                  clearActivePreset();
                  setProjectType(event.target.value as ProjectBlueprintProjectType);
                }}
                className={cn(selectClassName, "h-8 w-full text-sm")}
              >
                {PROJECT_BLUEPRINT_PROJECT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="blueprint-stack-profile">Stack profile</Label>
              <select
                id="blueprint-stack-profile"
                value={stackProfile}
                onChange={(event) =>
                  handleStackProfileChange(
                    event.target.value as ProjectBlueprintStackProfile,
                  )
                }
                className={cn(selectClassName, "h-8 w-full text-sm")}
              >
                {PROJECT_BLUEPRINT_STACK_PROFILES.map((value) => (
                  <option key={value} value={value}>
                    {PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="blueprint-architecture-style">Architecture style</Label>
              <select
                id="blueprint-architecture-style"
                value={architectureStyle}
                onChange={(event) => {
                  clearActivePreset();
                  setArchitectureStyle(
                    event.target.value as ProjectBlueprintArchitectureStyle,
                  );
                }}
                className={cn(selectClassName, "h-8 w-full text-sm")}
              >
                {PROJECT_BLUEPRINT_ARCHITECTURE_STYLES.map((value) => (
                  <option key={value} value={value}>
                    {PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Blueprint preset</p>
            <div className="flex flex-wrap gap-2">
              {BLUEPRINT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "min-w-0 max-w-full rounded-md border p-2.5 text-left transition-colors sm:max-w-[calc(50%-0.25rem)]",
                    activePresetId === preset.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                  aria-pressed={activePresetId === preset.id}
                >
                  <p className="text-sm font-medium">{preset.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Automation level</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {PROJECT_BLUEPRINT_AUTOMATION_LEVELS.map((level) => {
                const config = PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG[level];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleAutomationLevelChange(level)}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      automationLevel === level
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40",
                    )}
                    aria-pressed={automationLevel === level}
                  >
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {config.guidanceText}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <ProjectBlueprintRulePackGroups
            rulePacks={rulePacks}
            stackProfile={stackProfile}
            onRulePacksChange={setRulePacks}
            onResetDefaults={handleResetBlueprintDefaults}
            onManualChange={clearActivePreset}
          />

          <div className="space-y-1.5">
            <Label htmlFor="blueprint-custom-notes">Custom notes</Label>
            <Textarea
              id="blueprint-custom-notes"
              value={customNotes}
              onChange={(event) => {
                clearActivePreset();
                setCustomNotes(event.target.value);
              }}
              placeholder="Additional instructions for this project..."
              rows={3}
              className={cn(textareaClassName, "min-h-[4.5rem]")}
            />
          </div>

          <ProjectBlueprintPreview input={blueprintInput} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              disabled={detecting || pending}
              onClick={handleCopyBlueprintPrompt}
            >
              <Copy className="size-4" />
              {onboardingUi.blueprintButtonLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              disabled={detecting || pending}
              onClick={handleDetect}
            >
              <ScanSearch className="size-4" />
              {detecting ? "Detecting…" : onboardingUi.detectButtonLabel}
            </Button>
          </div>
          {onboardingUi.showPostBlueprintNextStep && hasCopiedBlueprintPrompt ? (
            <p className="text-xs text-muted-foreground">
              Open the folder in Cursor, run the copied prompt, then return here
              and detect the project.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Expenses Tracker v3"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="expenses-tracker-v3"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only"
        />
        <p className="text-xs text-muted-foreground">
          URL-safe identifier (lowercase, hyphens).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this project is for…"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repoUrl">Repository URL</Label>
        <Input
          id="repoUrl"
          name="repoUrl"
          type="url"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="https://github.com/you/repo"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending || detecting}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
