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
import { ProjectRunProfilesImport } from "@/components/projects/project-run-profiles-import";
import {
  ProjectRunProfileForm,
  type RunProfileFormValues,
} from "@/components/projects/project-run-profile-form";
import {
  buildRunProfileCdCommandCopy,
  buildRunProfileCommandCopy,
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
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function RunProfileRow({
  profile,
  projectId,
  projectLocalPath,
  onEdit,
}: {
  profile: RunProfileListItem;
  projectId: string;
  projectLocalPath: string | null;
  onEdit: (profile: RunProfileListItem) => void;
}) {
  const copyInput = {
    command: profile.command,
    workingDirectory: profile.workingDirectory,
  };

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

      <div className="space-y-2 text-xs">
        <div>
          <p className="font-medium text-muted-foreground">Command</p>
          <code className="mt-1 block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-[11px]">
            {profile.command}
          </code>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Working directory</p>
          {profile.workingDirectory ? (
            <code className="mt-1 block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-[11px]">
              {profile.workingDirectory}
            </code>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Not set
              {projectLocalPath
                ? " — copy cd + command will use command only unless you set a directory."
                : " — set a working directory or project local path for cd + command."}
            </p>
          )}
        </div>
        {profile.description ? (
          <div>
            <p className="font-medium text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {profile.description}
            </p>
          </div>
        ) : null}
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
      </div>
      {!profile.workingDirectory ? (
        <p className="text-[11px] text-muted-foreground">
          No working directory on this profile. Copy cd + command copies the
          command only.
        </p>
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
          terminal — ManDev does not run commands in this phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                projectLocalPath={projectLocalPath}
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
