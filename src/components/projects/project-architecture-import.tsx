"use client";

import { useActionState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  importProjectArchitectureFromLocalFileAction,
  type ArchitectureActionState,
} from "@/app/projects/architecture/actions";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  localPath: string | null;
  onSuccess?: () => void;
};

const initialState: ArchitectureActionState | undefined = undefined;

export function ProjectArchitectureImport({
  projectId,
  localPath,
  onSuccess,
}: Props) {
  const [state, formAction, pending] = useActionState(
    importProjectArchitectureFromLocalFileAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
      onSuccess?.();
    } else if (state?.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state?.ok, state?.message, onSuccess]);

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
          {pending ? "Reading…" : "Read architecture from local path"}
        </Button>
      </form>
      {hasLocalPath ? (
        <p className="text-xs text-muted-foreground">
          This is not a file upload. ManDev reads{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {trimmedLocalPath}/.mandev/architecture.json
          </code>{" "}
          directly from the configured local project path.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Set a local path on this project first. ManDev reads{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            .mandev/architecture.json
          </code>{" "}
          from that path on disk — this is not a browser file upload.
        </p>
      )}
    </div>
  );
}
