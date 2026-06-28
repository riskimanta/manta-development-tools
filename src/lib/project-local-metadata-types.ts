import type {
  ProjectBlueprintArchitectureStyle,
  ProjectBlueprintAutomationLevel,
  ProjectBlueprintProjectType,
  ProjectBlueprintRulePack,
  ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";

export type MandevProjectJson = {
  name?: string;
  slug?: string;
  description?: string;
  repositoryUrl?: string;
  notes?: string;
};

export type MandevBlueprintJson = {
  projectType?: ProjectBlueprintProjectType;
  stackProfile?: ProjectBlueprintStackProfile;
  architectureStyle?: ProjectBlueprintArchitectureStyle;
  automationLevel?: ProjectBlueprintAutomationLevel;
  rulePacks?: ProjectBlueprintRulePack[];
  customNotes?: string;
};

export type ProjectLocalMetadata = {
  name?: string;
  slug?: string;
  description?: string;
  repositoryUrl?: string;
  localPath: string;
  warnings: string[];
  blueprint?: MandevBlueprintJson;
};

export type DetectProjectMetadataResult =
  | ({ ok: true } & ProjectLocalMetadata)
  | { ok: false; message: string };

export type DetectProjectMetadataActionResult =
  | { ok: true; metadata: ProjectLocalMetadata; message: string }
  | { ok: false; message: string };
