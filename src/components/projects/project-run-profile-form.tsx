"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  createRunProfile,
  updateRunProfile,
  type RunProfileActionState,
} from "@/app/projects/run-profiles/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RunProfileFormValues = {
  id?: string;
  name: string;
  command: string;
  workingDirectory?: string | null;
  description?: string | null;
  isDefault: boolean;
};

type Props = {
  projectId: string;
  projectLocalPath?: string | null;
  profile?: RunProfileFormValues;
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const initialState: RunProfileActionState | undefined = undefined;

export function ProjectRunProfileForm({
  projectId,
  projectLocalPath,
  profile,
  submitLabel,
  onCancel,
  onSuccess,
}: Props) {
  const isEdit = Boolean(profile?.id);
  const action = isEdit ? updateRunProfile : createRunProfile;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
      onSuccess?.();
    } else if (state?.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state?.ok, state?.message, onSuccess]);

  const workingDirectoryPlaceholder =
    projectLocalPath?.trim() ||
    "Uses project local path when empty";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      {profile?.id ? (
        <input type="hidden" name="id" value={profile.id} />
      ) : null}
      <FieldErrors errors={state?.fieldErrors} />

      <div className="space-y-2">
        <Label htmlFor={`run-profile-name-${projectId}`}>Name</Label>
        <Input
          id={`run-profile-name-${projectId}`}
          name="name"
          required
          placeholder="Dev server"
          defaultValue={profile?.name ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`run-profile-command-${projectId}`}>Command</Label>
        <Input
          id={`run-profile-command-${projectId}`}
          name="command"
          required
          placeholder="pnpm dev"
          defaultValue={profile?.command ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`run-profile-wd-${projectId}`}>
          Working directory
        </Label>
        <Input
          id={`run-profile-wd-${projectId}`}
          name="workingDirectory"
          placeholder={workingDirectoryPlaceholder}
          defaultValue={profile?.workingDirectory ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the project local path when set.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`run-profile-description-${projectId}`}>
          Description
        </Label>
        <Textarea
          id={`run-profile-description-${projectId}`}
          name="description"
          rows={2}
          placeholder="Optional notes about when to use this profile"
          defaultValue={profile?.description ?? ""}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          value="true"
          defaultChecked={profile?.isDefault ?? false}
          className="size-4 rounded border border-input accent-primary"
        />
        Default run profile for this project
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : (submitLabel ??
              (isEdit ? "Save run profile" : "Add run profile"))}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
