import type { RunProfileManagedProcessSnapshot } from "@/lib/run-profile-process-manager";

export type ManagedRunProfileActionFailureReason =
  | "disabled"
  | "not_found"
  | "invalid_command"
  | "missing_working_directory"
  | "invalid_working_directory"
  | "not_directory"
  | "manager_error";

export type ManagedRunProfileActionResult =
  | {
      ok: true;
      snapshot: RunProfileManagedProcessSnapshot | null;
      snapshots?: RunProfileManagedProcessSnapshot[];
      message: string;
      processManagerBootSessionId: string;
    }
  | {
      ok: false;
      snapshot?: RunProfileManagedProcessSnapshot | null;
      snapshots?: RunProfileManagedProcessSnapshot[];
      message: string;
      reason: ManagedRunProfileActionFailureReason;
      processManagerBootSessionId: string;
    };
