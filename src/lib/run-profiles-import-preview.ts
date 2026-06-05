import { resolveImportedRunProfileWorkingDirectory } from "@/lib/run-profile-working-directory";
import type { NormalizedRunProfileImportEntry } from "@/lib/validations/run-profile-import";

export type RunProfileImportPreviewExisting = {
  name: string;
  command: string;
  workingDirectory: string | null;
  description: string | null;
  isDefault: boolean;
};

export type RunProfileImportPreviewEntry = {
  name: string;
  command: string;
  workingDirectory: string | null;
  description: string | null;
  isDefault: boolean;
};

export type RunProfileImportPreviewField =
  | "command"
  | "workingDirectory"
  | "description"
  | "isDefault";

export type RunProfileImportPreviewFieldChange = {
  field: RunProfileImportPreviewField;
  before: string | boolean | null;
  after: string | boolean | null;
};

export type RunProfileImportPreviewUpdate = RunProfileImportPreviewEntry & {
  changes: RunProfileImportPreviewFieldChange[];
};

export type RunProfileImportPreviewKept = {
  name: string;
  isDefault: boolean;
};

export type RunProfilesImportPreview = {
  totalInFile: number;
  create: RunProfileImportPreviewEntry[];
  update: RunProfileImportPreviewUpdate[];
  unchanged: RunProfileImportPreviewEntry[];
  kept: RunProfileImportPreviewKept[];
  currentDefaultName: string | null;
  nextDefaultName: string | null;
  defaultWillChange: boolean;
};

export type RunProfilesImportPreviewInput = {
  existing: RunProfileImportPreviewExisting[];
  imported: NormalizedRunProfileImportEntry[];
  projectLocalPath: string | null;
};

type ComparableProfile = RunProfileImportPreviewEntry;

function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toComparableImported(
  profile: NormalizedRunProfileImportEntry,
  projectLocalPath: string | null,
): ComparableProfile {
  return {
    name: profile.name.trim(),
    command: profile.command.trim(),
    workingDirectory: resolveImportedRunProfileWorkingDirectory(
      profile.workingDirectory,
      projectLocalPath,
    ),
    description: normalizeDescription(profile.description),
    isDefault: profile.isDefault,
  };
}

function toComparableExisting(
  profile: RunProfileImportPreviewExisting,
): ComparableProfile {
  return {
    name: profile.name.trim(),
    command: profile.command.trim(),
    workingDirectory: profile.workingDirectory?.trim() || null,
    description: normalizeDescription(profile.description),
    isDefault: profile.isDefault,
  };
}

function getProfileChanges(
  existing: ComparableProfile,
  imported: ComparableProfile,
): RunProfileImportPreviewFieldChange[] {
  const changes: RunProfileImportPreviewFieldChange[] = [];

  if (existing.command !== imported.command) {
    changes.push({
      field: "command",
      before: existing.command,
      after: imported.command,
    });
  }
  if (existing.workingDirectory !== imported.workingDirectory) {
    changes.push({
      field: "workingDirectory",
      before: existing.workingDirectory,
      after: imported.workingDirectory,
    });
  }
  if (existing.description !== imported.description) {
    changes.push({
      field: "description",
      before: existing.description,
      after: imported.description,
    });
  }
  if (existing.isDefault !== imported.isDefault) {
    changes.push({
      field: "isDefault",
      before: existing.isDefault,
      after: imported.isDefault,
    });
  }

  return changes;
}

function findExistingByName(
  existing: RunProfileImportPreviewExisting[],
  name: string,
): RunProfileImportPreviewExisting | undefined {
  const normalized = name.trim();
  return existing.find((profile) => profile.name.trim() === normalized);
}

function computeDefaultImpact(
  existing: RunProfileImportPreviewExisting[],
  imported: NormalizedRunProfileImportEntry[],
  projectLocalPath: string | null,
): Pick<
  RunProfilesImportPreview,
  "currentDefaultName" | "nextDefaultName" | "defaultWillChange"
> {
  const currentDefaultName =
    existing.find((profile) => profile.isDefault)?.name.trim() ?? null;

  const importedNames = new Set(
    imported.map((profile) => profile.name.trim()),
  );
  const hasImportedDefault = imported.some((profile) => profile.isDefault);
  const defaultState = new Map<string, boolean>();

  for (const profile of existing) {
    const name = profile.name.trim();
    if (importedNames.has(name)) {
      continue;
    }

    defaultState.set(
      name,
      hasImportedDefault ? false : profile.isDefault,
    );
  }

  for (const profile of imported) {
    const comparable = toComparableImported(profile, projectLocalPath);
    defaultState.set(comparable.name, comparable.isDefault);
  }

  const nextDefaultName =
    [...defaultState.entries()].find(([, isDefault]) => isDefault)?.[0] ??
    null;

  return {
    currentDefaultName,
    nextDefaultName,
    defaultWillChange: currentDefaultName !== nextDefaultName,
  };
}

export function buildRunProfilesImportPreview(
  input: RunProfilesImportPreviewInput,
): RunProfilesImportPreview {
  const importedNames = new Set<string>();
  const create: RunProfileImportPreviewEntry[] = [];
  const update: RunProfileImportPreviewUpdate[] = [];
  const unchanged: RunProfileImportPreviewEntry[] = [];

  for (const importedProfile of input.imported) {
    const comparableImported = toComparableImported(
      importedProfile,
      input.projectLocalPath,
    );
    importedNames.add(comparableImported.name);

    const match = findExistingByName(input.existing, comparableImported.name);
    if (!match) {
      create.push(comparableImported);
      continue;
    }

    const comparableExisting = toComparableExisting(match);
    const changes = getProfileChanges(comparableExisting, comparableImported);

    if (changes.length === 0) {
      unchanged.push(comparableImported);
    } else {
      update.push({
        ...comparableImported,
        changes,
      });
    }
  }

  const kept = input.existing
    .filter((profile) => !importedNames.has(profile.name.trim()))
    .map((profile) => ({
      name: profile.name.trim(),
      isDefault: profile.isDefault,
    }));

  return {
    totalInFile: input.imported.length,
    create,
    update,
    unchanged,
    kept,
    ...computeDefaultImpact(
      input.existing,
      input.imported,
      input.projectLocalPath,
    ),
  };
}
