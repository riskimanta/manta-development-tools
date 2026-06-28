import { readFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type {
  DetectProjectMetadataResult,
  MandevBlueprintJson,
  MandevProjectJson,
} from "@/lib/project-local-metadata-types";
import {
  DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLES,
  PROJECT_BLUEPRINT_AUTOMATION_LEVELS,
  PROJECT_BLUEPRINT_PROJECT_TYPES,
  PROJECT_BLUEPRINT_RULE_PACKS,
  PROJECT_BLUEPRINT_STACK_PROFILES,
  type ProjectBlueprintArchitectureStyle,
  type ProjectBlueprintAutomationLevel,
  type ProjectBlueprintProjectType,
  type ProjectBlueprintRulePack,
  type ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";

export type GitExecFn = (cwd: string, args: string[]) => Promise<string>;

type DetectDeps = {
  pathExists: (targetPath: string) => boolean;
  readFile: (filePath: string) => Promise<string>;
  execGit: GitExecFn;
};

const execFileAsync = promisify(execFile);

export const MANDEV_PROJECT_RELATIVE = path.join(".mandev", "project.json");
export const MANDEV_BLUEPRINT_RELATIVE = path.join(".mandev", "blueprint.json");

const defaultPathExists = (targetPath: string): boolean => fs.existsSync(targetPath);

const defaultReadFile: (filePath: string) => Promise<string> = (filePath) =>
  readFile(filePath, "utf8");

const defaultExecGit: GitExecFn = async (cwd, args) => {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 64 * 1024,
  });
  return stdout.trimEnd();
};

type PackageJsonFields = {
  name?: string;
  description?: string;
  repository?: unknown;
};

export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/@/g, "")
    .replace(/[/\\]+/g, "-")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function humanizeFolderName(folderName: string): string {
  return folderName
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeRepositoryUrl(url: string): string | null {
  let normalized = url.trim();
  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(/^git\+/, "");

  const sshMatch = /^git@([^:]+):(.+)$/.exec(normalized);
  if (sshMatch) {
    normalized = `https://${sshMatch[1]}/${sshMatch[2]}`;
  }

  normalized = normalized.replace(/\.git$/, "");

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function extractRepositoryUrl(repository: unknown): string | null {
  if (!repository) {
    return null;
  }

  let raw: string | null = null;
  if (typeof repository === "string") {
    raw = repository;
  } else if (typeof repository === "object" && repository !== null && "url" in repository) {
    const url = (repository as { url: unknown }).url;
    if (typeof url === "string") {
      raw = url;
    }
  }

  if (!raw) {
    return null;
  }

  return normalizeRepositoryUrl(raw);
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parsePackageJson(raw: string): PackageJsonFields | null {
  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return null;
  }
  return parsed as PackageJsonFields;
}

function readOptionalStringField(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseMandevProjectJson(raw: string): MandevProjectJson | null {
  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return null;
  }

  return {
    name: readOptionalStringField(parsed, "name"),
    slug: readOptionalStringField(parsed, "slug"),
    description: readOptionalStringField(parsed, "description"),
    repositoryUrl: readOptionalStringField(parsed, "repositoryUrl"),
    notes: readOptionalStringField(parsed, "notes"),
  };
}

function resolveFileUnderRoot(root: string, relativePath: string): string {
  const filePath = path.resolve(root, relativePath);
  const relative = path.relative(root, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("PATH_UNSAFE");
  }
  return filePath;
}

function resolvePackageJsonPath(root: string): string {
  return resolveFileUnderRoot(root, "package.json");
}

export function resolveMandevProjectJsonPath(root: string): string {
  return resolveFileUnderRoot(root, MANDEV_PROJECT_RELATIVE);
}

export function resolveMandevBlueprintJsonPath(root: string): string {
  return resolveFileUnderRoot(root, MANDEV_BLUEPRINT_RELATIVE);
}

function isProjectBlueprintProjectType(
  value: string,
): value is ProjectBlueprintProjectType {
  return (PROJECT_BLUEPRINT_PROJECT_TYPES as string[]).includes(value);
}

function isProjectBlueprintStackProfile(
  value: string,
): value is ProjectBlueprintStackProfile {
  return (PROJECT_BLUEPRINT_STACK_PROFILES as string[]).includes(value);
}

function isProjectBlueprintArchitectureStyle(
  value: string,
): value is ProjectBlueprintArchitectureStyle {
  return (PROJECT_BLUEPRINT_ARCHITECTURE_STYLES as string[]).includes(value);
}

function isProjectBlueprintRulePack(value: string): value is ProjectBlueprintRulePack {
  return (PROJECT_BLUEPRINT_RULE_PACKS as string[]).includes(value);
}

export function parseBlueprintAutomationLevel(
  value: unknown,
): { automationLevel: ProjectBlueprintAutomationLevel; warning: string | null } {
  if (typeof value !== "string") {
    return {
      automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
      warning: null,
    };
  }

  if ((PROJECT_BLUEPRINT_AUTOMATION_LEVELS as string[]).includes(value)) {
    return {
      automationLevel: value as ProjectBlueprintAutomationLevel,
      warning: null,
    };
  }

  return {
    automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
    warning:
      ".mandev/blueprint.json had an invalid automationLevel; using safe-autopilot.",
  };
}

export function parseMandevBlueprintJson(
  raw: string,
): { blueprint: MandevBlueprintJson | null; warnings: string[] } {
  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return {
      blueprint: null,
      warnings: [".mandev/blueprint.json could not be parsed."],
    };
  }

  const warnings: string[] = [];
  const blueprint: MandevBlueprintJson = {};

  const projectType = parsed.projectType;
  if (typeof projectType === "string") {
    if (isProjectBlueprintProjectType(projectType)) {
      blueprint.projectType = projectType;
    } else {
      warnings.push(".mandev/blueprint.json had an invalid projectType.");
    }
  }

  const stackProfile = parsed.stackProfile;
  if (typeof stackProfile === "string") {
    if (isProjectBlueprintStackProfile(stackProfile)) {
      blueprint.stackProfile = stackProfile;
    } else {
      warnings.push(".mandev/blueprint.json had an invalid stackProfile.");
    }
  }

  const architectureStyle = parsed.architectureStyle;
  if (typeof architectureStyle === "string") {
    if (isProjectBlueprintArchitectureStyle(architectureStyle)) {
      blueprint.architectureStyle = architectureStyle;
    } else {
      warnings.push(".mandev/blueprint.json had an invalid architectureStyle.");
    }
  }

  if ("automationLevel" in parsed) {
    const { automationLevel, warning } = parseBlueprintAutomationLevel(
      parsed.automationLevel,
    );
    blueprint.automationLevel = automationLevel;
    if (warning) {
      warnings.push(warning);
    }
  }

  const rulePacks = parsed.rulePacks;
  if (Array.isArray(rulePacks)) {
    const validPacks = rulePacks.filter(
      (pack): pack is ProjectBlueprintRulePack =>
        typeof pack === "string" && isProjectBlueprintRulePack(pack),
    );
    if (validPacks.length > 0) {
      blueprint.rulePacks = validPacks;
    }
    if (validPacks.length !== rulePacks.length) {
      warnings.push(".mandev/blueprint.json contained invalid rule pack entries.");
    }
  }

  const customNotes = readOptionalStringField(parsed, "customNotes");
  if (customNotes) {
    blueprint.customNotes = customNotes;
  }

  const hasFields = Object.keys(blueprint).length > 0;
  return {
    blueprint: hasFields ? blueprint : null,
    warnings,
  };
}

async function readMandevBlueprintJson(
  root: string,
  readFileFn: (filePath: string) => Promise<string>,
): Promise<{ blueprint: MandevBlueprintJson | null; warnings: string[] }> {
  try {
    const blueprintPath = resolveMandevBlueprintJsonPath(root);
    const raw = await readFileFn(blueprintPath);
    return parseMandevBlueprintJson(raw);
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      return { blueprint: null, warnings: [] };
    }
    return {
      blueprint: null,
      warnings: [".mandev/blueprint.json could not be read."],
    };
  }
}

async function readGitRemoteOrigin(
  root: string,
  execGit: GitExecFn,
): Promise<string | null> {
  try {
    const output = await execGit(root, ["remote", "get-url", "origin"]);
    const trimmed = output.trim();
    return trimmed ? normalizeRepositoryUrl(trimmed) : null;
  } catch {
    return null;
  }
}

async function readMandevProjectJson(
  root: string,
  readFileFn: (filePath: string) => Promise<string>,
): Promise<{ fields: MandevProjectJson | null; warning: string | null }> {
  try {
    const mandevProjectPath = resolveMandevProjectJsonPath(root);
    const raw = await readFileFn(mandevProjectPath);
    const fields = parseMandevProjectJson(raw);
    if (!fields) {
      return {
        fields: null,
        warning: ".mandev/project.json could not be parsed, falling back to other sources.",
      };
    }
    return { fields, warning: null };
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      return { fields: null, warning: null };
    }
    return {
      fields: null,
      warning: ".mandev/project.json could not be read, falling back to other sources.",
    };
  }
}

export async function detectProjectMetadataFromLocalPath(
  localPath: string,
  deps: Partial<DetectDeps> = {},
): Promise<DetectProjectMetadataResult> {
  const trimmedLocalPath = localPath.trim();
  if (!trimmedLocalPath) {
    return { ok: false, message: "Local path is required." };
  }

  const pathExists = deps.pathExists ?? defaultPathExists;
  const readFileFn = deps.readFile ?? defaultReadFile;
  const execGit = deps.execGit ?? defaultExecGit;

  const root = path.resolve(trimmedLocalPath);
  if (!pathExists(root)) {
    return { ok: false, message: "Local path does not exist." };
  }

  const warnings: string[] = [];

  const { fields: mandevFields, warning: mandevWarning } =
    await readMandevProjectJson(root, readFileFn);
  if (mandevWarning) {
    warnings.push(mandevWarning);
  }

  let packageFields: PackageJsonFields | null = null;

  try {
    const packageJsonPath = resolvePackageJsonPath(root);
    const rawPackageJson = await readFileFn(packageJsonPath);
    packageFields = parsePackageJson(rawPackageJson);
    if (!packageFields) {
      warnings.push("package.json could not be parsed, using folder name only.");
    }
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      warnings.push("package.json was not found, using folder name only.");
    } else {
      warnings.push("package.json could not be read, using folder name only.");
    }
  }

  const folderBasename = path.basename(root);
  const folderSlug = generateSlugFromName(folderBasename);

  const mandevName = mandevFields?.name;
  const packageName = packageFields?.name?.trim();

  let name: string | undefined;
  if (mandevName) {
    name = mandevName;
  } else if (packageName) {
    name = packageName;
  } else if (folderBasename) {
    name = humanizeFolderName(folderBasename);
  }

  let slug: string | undefined;
  const mandevSlug = mandevFields?.slug;
  if (mandevSlug) {
    slug = generateSlugFromName(mandevSlug) || mandevSlug;
  } else if (name) {
    slug = generateSlugFromName(name) || folderSlug;
  } else {
    slug = folderSlug || undefined;
  }

  const description =
    mandevFields?.description ||
    packageFields?.description?.trim() ||
    undefined;

  let repositoryUrl: string | undefined;
  const mandevRepo = mandevFields?.repositoryUrl
    ? normalizeRepositoryUrl(mandevFields.repositoryUrl)
    : null;
  if (mandevRepo) {
    repositoryUrl = mandevRepo;
  } else {
    const packageRepo = extractRepositoryUrl(packageFields?.repository);
    if (packageRepo) {
      repositoryUrl = packageRepo;
    } else {
      const gitRemote = await readGitRemoteOrigin(root, execGit);
      if (gitRemote) {
        repositoryUrl = gitRemote;
      } else {
        warnings.push("Unable to read git remote.");
      }
    }
  }

  if (mandevFields?.notes) {
    warnings.push(`ManDev notes: ${mandevFields.notes}`);
  }

  const { blueprint, warnings: blueprintWarnings } = await readMandevBlueprintJson(
    root,
    readFileFn,
  );
  if (blueprintWarnings.length > 0) {
    warnings.push(...blueprintWarnings);
  }

  return {
    ok: true,
    name,
    slug,
    description,
    repositoryUrl,
    localPath: root,
    warnings,
    ...(blueprint ? { blueprint } : {}),
  };
}
