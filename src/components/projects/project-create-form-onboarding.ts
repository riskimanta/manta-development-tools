export type ProjectOnboardingMode = "existing-project" | "new-project";

export const DEFAULT_PROJECT_ONBOARDING_MODE: ProjectOnboardingMode =
  "existing-project";

type ProjectOnboardingUiConfig = {
  detectButtonLabel: string;
  setupButtonLabel: string;
  blueprintButtonLabel: string;
  showBlueprintConfiguration: boolean;
  showExistingProjectHelper: boolean;
  showEmptyFolderNotice: boolean;
  showPostBlueprintNextStep: boolean;
};

const SHARED_LABELS = {
  detectButtonLabel: "Detect project",
  setupButtonLabel: "Prepare metadata with Cursor",
  blueprintButtonLabel: "Prepare new project with Cursor",
} as const;

export function getProjectOnboardingUiConfig(
  mode: ProjectOnboardingMode,
): ProjectOnboardingUiConfig {
  if (mode === "new-project") {
    return {
      ...SHARED_LABELS,
      showBlueprintConfiguration: true,
      showExistingProjectHelper: false,
      showEmptyFolderNotice: true,
      showPostBlueprintNextStep: true,
    };
  }

  return {
    ...SHARED_LABELS,
    showBlueprintConfiguration: false,
    showExistingProjectHelper: true,
    showEmptyFolderNotice: false,
    showPostBlueprintNextStep: false,
  };
}
