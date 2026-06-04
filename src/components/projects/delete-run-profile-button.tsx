"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteRunProfile } from "@/app/projects/run-profiles/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  profileId: string;
  projectId: string;
  profileName: string;
};

export function DeleteRunProfileButton({
  profileId,
  projectId,
  profileName,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete run profile?"
        description={
          <>
            <p>
              <span className="font-medium text-foreground">{profileName}</span>{" "}
              will be permanently removed.
            </p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        }
        confirmLabel="Delete profile"
        formAction={deleteRunProfile}
        hiddenFields={{ id: profileId, projectId }}
      />
    </>
  );
}
