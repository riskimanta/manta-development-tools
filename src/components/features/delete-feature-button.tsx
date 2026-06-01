"use client";

import { useState } from "react";

import { deleteFeature } from "@/app/features/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteFeatureButton({ featureId }: { featureId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Delete feature
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete feature?"
        description={
          <>
            <p>This feature will be permanently deleted.</p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        }
        confirmLabel="Delete feature"
        formAction={deleteFeature}
        hiddenFields={{ id: featureId }}
      />
    </>
  );
}
