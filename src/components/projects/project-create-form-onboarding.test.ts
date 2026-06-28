import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROJECT_ONBOARDING_MODE,
  getProjectOnboardingUiConfig,
} from "@/components/projects/project-create-form-onboarding";

describe("project create onboarding mode UI", () => {
  it("defaults to existing project mode", () => {
    expect(DEFAULT_PROJECT_ONBOARDING_MODE).toBe("existing-project");
  });

  it("returns existing project mode copy and visibility", () => {
    const config = getProjectOnboardingUiConfig("existing-project");

    expect(config.detectButtonLabel).toBe("Detect project");
    expect(config.setupButtonLabel).toBe("Prepare metadata with Cursor");
    expect(config.blueprintButtonLabel).toBe("Prepare new project with Cursor");
    expect(config.showBlueprintConfiguration).toBe(false);
    expect(config.showExistingProjectHelper).toBe(true);
    expect(config.showEmptyFolderNotice).toBe(false);
    expect(config.showPostBlueprintNextStep).toBe(false);
  });

  it("returns new project mode copy and visibility", () => {
    const config = getProjectOnboardingUiConfig("new-project");

    expect(config.detectButtonLabel).toBe("Detect project");
    expect(config.setupButtonLabel).toBe("Prepare metadata with Cursor");
    expect(config.blueprintButtonLabel).toBe("Prepare new project with Cursor");
    expect(config.showBlueprintConfiguration).toBe(true);
    expect(config.showExistingProjectHelper).toBe(false);
    expect(config.showEmptyFolderNotice).toBe(true);
    expect(config.showPostBlueprintNextStep).toBe(true);
  });
});
