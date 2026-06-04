"use client";

import { useActionState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  importRunProfilesFromLocalPathAction,
  type RunProfileActionState,
} from "@/app/projects/run-profiles/actions";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  localPath: string | null;
};

const initialState: RunProfileActionState | undefined = undefined;

export function ProjectRunProfilesImport({ projectId, localPath }: Props) {
  const [state, formAction, pending] = useActionState(
    importRunProfilesFromLocalPathAction,
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
          <Download className="size-3.5" />
          {pending ? "Reading…" : "Read run profiles from local path"}
        </Button>
      </form>
      {hasLocalPath ? (
        <p className="text-xs text-muted-foreground">
          This is not a file upload. ManDev reads{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {trimmedLocalPath}/.mandev/run-profiles.json
          </code>{" "}
          directly from the configured local project path.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Set a local path on this project first. ManDev reads{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            .mandev/run-profiles.json
          </code>{" "}
          from that path on disk — this is not a browser file upload.
        </p>
      )}
    </div>
  );
}
