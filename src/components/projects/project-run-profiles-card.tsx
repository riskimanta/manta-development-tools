"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteRunProfileButton } from "@/components/projects/delete-run-profile-button";
import { RunProfileExecutionResultPanel } from "@/components/projects/run-profile-execution-result-panel";
import { RunRunProfileButton } from "@/components/projects/run-run-profile-button";
import { ProjectRunProfilesImport } from "@/components/projects/project-run-profiles-import";
import {
  ProjectRunProfileForm,
  type RunProfileFormValues,
} from "@/components/projects/project-run-profile-form";
import { COMMAND_EXECUTION_DISABLED_MESSAGE } from "@/lib/mandev-command-execution";
import type { RunProfileExecutionResult } from "@/lib/run-profile-execution";
import {
  buildRunProfileCdCommandCopy,
  buildRunProfileCommandCopy,
  getRunProfileCopyPreview,
  RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT,
} from "@/lib/run-profile-copy";
import { buildRunProfilesImportCursorPrompt } from "@/lib/run-profiles-import-template";

export type RunProfileListItem = {
  id: string;
  name: string;
  command: string;
  workingDirectory: string | null;
  description: string | null;
  isDefault: boolean;
};

type Props = {
  projectId: string;
  projectName: string;
  projectLocalPath: string | null;
  projectRepoUrl?: string | null;
  profiles: RunProfileListItem[];
  commandExecutionEnabled?: boolean;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const previewCodeClassName =
  "mt-0.5 block break-all rounded bg-muted/80 px-2 py-1 font-mono text-[11px] text-foreground/90";

function RunProfileRow({
  profile,
  projectId,
  commandExecutionEnabled,
  onEdit,
}: {
  profile: RunProfileListItem;
  projectId: string;
  commandExecutionEnabled: boolean;
  onEdit: (profile: RunProfileListItem) => void;
}) {
  const [lastRun, setLastRun] = useState<RunProfileExecutionResult | null>(
    null,
  );

  const copyInput = {
    command: profile.command,
    workingDirectory: profile.workingDirectory,
  };
  const copyPreview = getRunProfileCopyPreview(copyInput);

  async function handleCopyCommand() {
    const text = buildRunProfileCommandCopy(copyInput);
    const ok = await copyText(text);
    if (ok) {
      toast.success("Command copied to clipboard");
    } else {
      toast.error("Could not copy command");
    }
  }

  async function handleCopyCdCommand() {
    const { text, hasWorkingDirectory } =
      buildRunProfileCdCommandCopy(copyInput);

    const ok = await copyText(text);
    if (ok) {
      if (hasWorkingDirectory) {
        toast.success("cd + command copied to clipboard");
      } else {
        toast.success("Command copied (no working directory configured)");
      }
    } else {
      toast.error("Could not copy command");
    }
  }

  return (
    <li className="rounded-md border border-border/80 bg-muted/15 p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h3 className="text-sm font-medium">{profile.name}</h3>
          {profile.isDefault ? (
            <Badge variant="secondary" className="text-[10px] uppercase">
              Default
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => onEdit(profile)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <DeleteRunProfileButton
            profileId={profile.id}
            projectId={projectId}
            profileName={profile.name}
          />
        </div>
      </div>

      {profile.description ? (
        <p className="text-xs whitespace-pre-wrap text-muted-foreground">
          {profile.description}
        </p>
      ) : null}

      <div className="space-y-2 rounded-md border border-dashed border-border/70 bg-muted/10 p-2.5 text-xs">
        <p className="text-[11px] font-medium text-muted-foreground">
          Clipboard preview — copy only, not executed by ManDev
        </p>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            Copy command
          </p>
          <code className={previewCodeClassName}>{copyPreview.commandOnly}</code>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            Copy cd + command
          </p>
          {copyPreview.cdCommand.hasWorkingDirectory ? (
            <code className={previewCodeClassName}>
              {copyPreview.cdCommand.text}
            </code>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleCopyCommand}
        >
          <Copy className="size-3.5" />
          Copy command
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleCopyCdCommand}
        >
          <Copy className="size-3.5" />
          Copy cd + command
        </Button>
        {commandExecutionEnabled ? (
          <RunRunProfileButton
            profileId={profile.id}
            profileName={profile.name}
            command={profile.command}
            workingDirectory={profile.workingDirectory}
            onExecutionComplete={(result) => setLastRun(result)}
          />
        ) : null}
      </div>

      {lastRun ? (
        <RunProfileExecutionResultPanel
          heading="Last run just now"
          result={lastRun}
          className="space-y-2 rounded-md border border-border/80 bg-muted/20 p-3 text-xs"
        />
      ) : null}
    </li>
  );
}

export function ProjectRunProfilesCard({
  projectId,
  projectName,
  projectLocalPath,
  projectRepoUrl,
  profiles,
  commandExecutionEnabled = false,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<RunProfileListItem | null>(null);

  const handleSaveSuccess = useCallback(() => {
    setCreating(false);
    setEditingProfile(null);
  }, []);

  const aiRunProfilesPrompt = useMemo(
    () =>
      buildRunProfilesImportCursorPrompt({
        name: projectName,
        localPath: projectLocalPath,
        repoUrl: projectRepoUrl,
      }),
    [projectName, projectLocalPath, projectRepoUrl],
  );

  async function handleCopyAiRunProfilesPrompt() {
    const ok = await copyText(aiRunProfilesPrompt);
    if (ok) {
      toast.success("AI run profiles prompt copied");
    } else {
      toast.error("Could not copy AI run profiles prompt");
    }
  }

  const editFormValues: RunProfileFormValues | undefined = editingProfile
    ? {
        id: editingProfile.id,
        name: editingProfile.name,
        command: editingProfile.command,
        workingDirectory: editingProfile.workingDirectory,
        description: editingProfile.description,
        isDefault: editingProfile.isDefault,
      }
    : undefined;

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Run profiles</CardTitle>
        <CardDescription>
          Store local run commands for this project. Copy them into your
          terminal, or run saved profiles locally when command execution is
          enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!commandExecutionEnabled ? (
          <p className="rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
            {COMMAND_EXECUTION_DISABLED_MESSAGE}
          </p>
        ) : (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            Local command execution is enabled. Only saved run profiles can be
            executed — experimental, local-only.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopyAiRunProfilesPrompt}
          >
            <Sparkles className="size-3.5" />
            Copy AI run profiles prompt
          </Button>
        </div>

        <ProjectRunProfilesImport
          projectId={projectId}
          localPath={projectLocalPath}
        />

        {profiles.length === 0 && !creating ? (
          <EmptyState
            title="No run profiles yet"
            description="Add commands like pnpm dev, docker compose up, or ./mvnw spring-boot:run."
            className="py-8"
          >
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setCreating(true)}
            >
              <Plus className="size-3.5" />
              Add run profile
            </Button>
          </EmptyState>
        ) : null}

        {profiles.length > 0 ? (
          <ul className="space-y-3">
            {profiles.map((profile) => (
              <RunProfileRow
                key={profile.id}
                profile={profile}
                projectId={projectId}
                commandExecutionEnabled={commandExecutionEnabled}
                onEdit={setEditingProfile}
              />
            ))}
          </ul>
        ) : null}

        {profiles.length > 0 && !creating ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-3.5" />
            Add run profile
          </Button>
        ) : null}

        {creating ? (
          <div className="rounded-md border border-border/80 p-3">
            <p className="mb-3 text-sm font-medium">New run profile</p>
            <ProjectRunProfileForm
              projectId={projectId}
              projectLocalPath={projectLocalPath}
              onCancel={() => setCreating(false)}
              onSuccess={handleSaveSuccess}
            />
          </div>
        ) : null}

        <Dialog
          open={editingProfile !== null}
          onOpenChange={(open) => {
            if (!open) setEditingProfile(null);
          }}
        >
          <DialogContent showCloseButton className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit run profile</DialogTitle>
            </DialogHeader>
            {editFormValues ? (
              <ProjectRunProfileForm
                projectId={projectId}
                projectLocalPath={projectLocalPath}
                profile={editFormValues}
                submitLabel="Save changes"
                onCancel={() => setEditingProfile(null)}
                onSuccess={handleSaveSuccess}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
