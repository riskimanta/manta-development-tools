"use client";

import { useState } from "react";

import { deleteProject } from "@/app/projects/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Delete project
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project?"
        description={
          <>
            <p>This project will be permanently deleted.</p>
            <p className="mt-2">
              Related features may also be deleted because of database cascade
              behavior.
            </p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        }
        confirmLabel="Delete project"
        formAction={deleteProject}
        hiddenFields={{ id: projectId }}
      />
    </>
  );
}
