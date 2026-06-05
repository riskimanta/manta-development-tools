export const MANDEV_ENABLE_COMMAND_EXECUTION_ENV =
  "MANDEV_ENABLE_COMMAND_EXECUTION";

export const COMMAND_EXECUTION_DISABLED_MESSAGE =
  "Command execution is disabled. Set MANDEV_ENABLE_COMMAND_EXECUTION=true to enable local run actions.";

export function isCommandExecutionEnabled(): boolean {
  return process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV] === "true";
}
