"use client";

import { useActionState, useEffect } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import {
  captureWorkProgressAction,
  type WorkProgressActionState,
} from "@/app/projects/work-progress/actions";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  localPath: string | null;
};

const initialState: WorkProgressActionState | undefined = undefined;

export function CaptureWorkProgressButton({ projectId, localPath }: Props) {
  const [state, formAction, pending] = useActionState(
    captureWorkProgressAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
    } else if (state?.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state?.ok, state?.message]);

  const trimmedLocalPath = localPath?.trim() ?? "";
  const hasLocalPath = Boolean(trimmedLocalPath);

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!hasLocalPath || pending}
        >
          <Camera className="size-3.5" />
          {pending ? "Capturing…" : "Capture progress"}
        </Button>
      </form>
      {hasLocalPath ? (
        <p className="text-xs text-muted-foreground">
          Reads Git state from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {trimmedLocalPath}
          </code>{" "}
          — branch, latest commit, and working tree changes.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Set a local path on this project first. ManDev inspects that Git
          repository on disk when capturing progress.
        </p>
      )}
    </div>
  );
}
