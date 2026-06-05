export type RunProfileCopyInput = {
  command: string;
  workingDirectory: string | null;
};

export function buildRunProfileCommandCopy(input: RunProfileCopyInput): string {
  return input.command.trim();
}

export type RunProfileCdCommandCopyResult = {
  text: string;
  hasWorkingDirectory: boolean;
};

export function buildRunProfileCdCommandCopy(
  input: RunProfileCopyInput,
): RunProfileCdCommandCopyResult {
  const command = input.command.trim();
  const workingDirectory = input.workingDirectory?.trim();

  if (!workingDirectory) {
    return { text: command, hasWorkingDirectory: false };
  }

  return {
    text: `cd "${workingDirectory}" && ${command}`,
    hasWorkingDirectory: true,
  };
}

export type RunProfileCopyPreview = {
  commandOnly: string;
  cdCommand: RunProfileCdCommandCopyResult;
};

export const RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT =
  "No working directory set. Copy cd + command will copy the command only.";

export function getRunProfileCopyPreview(
  input: RunProfileCopyInput,
): RunProfileCopyPreview {
  return {
    commandOnly: buildRunProfileCommandCopy(input),
    cdCommand: buildRunProfileCdCommandCopy(input),
  };
}
