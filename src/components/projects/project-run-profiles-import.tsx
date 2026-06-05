"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  importRunProfilesFromLocalPathAction,
  previewRunProfilesImportFromLocalPathAction,
  type RunProfileActionState,
} from "@/app/projects/run-profiles/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RunProfilesImportPreview } from "@/lib/run-profiles-import-preview";

type Props = {
  projectId: string;
  localPath: string | null;
};

const initialState: RunProfileActionState | undefined = undefined;

const previewListClassName =
  "max-h-28 space-y-1 overflow-y-auto rounded-md border border-border/70 bg-muted/15 p-2";

function PreviewNameList({
  items,
  emptyLabel,
}: {
  items: Array<{ name: string }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className={previewListClassName}>
      {items.map((item) => (
        <li
          key={item.name}
          className="truncate font-mono text-[11px] text-foreground/90"
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}

function RunProfilesImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  projectId,
  onImportSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: RunProfilesImportPreview;
  projectId: string;
  onImportSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    importRunProfilesFromLocalPathAction,
    initialState,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (state?.ok && state.message) {
      toast.success(state.message);
      onImportSuccess();
      onOpenChange(false);
    } else if (state?.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state?.ok, state?.message, open, onImportSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Run profiles import preview</DialogTitle>
          <DialogDescription>
            Import will create or update profiles by name. Profiles not listed
            in the file will be kept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px]">
              {preview.totalInFile} in file
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {preview.create.length} to create
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {preview.update.length} to update
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {preview.unchanged.length} unchanged
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {preview.kept.length} kept
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                To create
              </p>
              <PreviewNameList
                items={preview.create}
                emptyLabel="No new profiles"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                To update
              </p>
              <PreviewNameList
                items={preview.update}
                emptyLabel="No profile updates"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Unchanged
              </p>
              <PreviewNameList
                items={preview.unchanged}
                emptyLabel="No unchanged profiles"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Kept (not in file)
              </p>
              <PreviewNameList
                items={preview.kept}
                emptyLabel="No profiles kept outside file"
              />
            </div>
          </div>

          <div className="rounded-md border border-border/70 bg-muted/10 p-2.5 text-xs">
            <p className="font-medium text-muted-foreground">Default profile</p>
            <p className="mt-1 text-muted-foreground">
              Current: {preview.currentDefaultName ?? "None"}
            </p>
            <p className="text-muted-foreground">
              After import: {preview.nextDefaultName ?? "None"}
            </p>
            <p className="mt-1 text-foreground/90">
              {preview.defaultWillChange
                ? "Default profile will change."
                : "Default profile will stay the same."}
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Preview only — ManDev will not run any commands. Confirm import
            writes profile changes to the database.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <form action={formAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <Button type="submit" disabled={pending}>
              {pending ? "Importing…" : "Confirm import"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectRunProfilesImport({ projectId, localPath }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<RunProfilesImportPreview | null>(null);
  const [isReading, startReading] = useTransition();

  const trimmedLocalPath = localPath?.trim() ?? "";
  const hasLocalPath = Boolean(trimmedLocalPath);

  function handleReadClick() {
    startReading(async () => {
      const result = await previewRunProfilesImportFromLocalPathAction(
        projectId,
      );

      if (result.ok) {
        setPreview(result.preview);
        setPreviewOpen(true);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={!hasLocalPath || isReading}
        onClick={handleReadClick}
      >
        <Download className="size-3.5" />
        {isReading ? "Reading…" : "Read run profiles from local path"}
      </Button>

      {preview ? (
        <RunProfilesImportPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          preview={preview}
          projectId={projectId}
          onImportSuccess={() => setPreview(null)}
        />
      ) : null}

      {hasLocalPath ? (
        <p className="text-xs text-muted-foreground">
          This is not a file upload. ManDev reads{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {trimmedLocalPath}/.mandev/run-profiles.json
          </code>{" "}
          and shows an import preview before writing profiles.
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
