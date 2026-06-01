"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  saveProjectArchitecture,
  type ArchitectureActionState,
} from "@/app/projects/architecture/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  projectId: string;
  summary?: string | null;
  mermaidSource: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const initialState: ArchitectureActionState | undefined = undefined;

export function ProjectArchitectureForm({
  projectId,
  summary,
  mermaidSource,
  submitLabel = "Save architecture",
  onCancel,
  onSuccess,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveProjectArchitecture,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
      onSuccess?.();
    }
  }, [state?.ok, state?.message, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <FieldErrors errors={state?.fieldErrors} />

      <div className="space-y-2">
        <Label htmlFor={`architecture-summary-${projectId}`}>Summary</Label>
        <Textarea
          id={`architecture-summary-${projectId}`}
          name="summary"
          rows={3}
          placeholder="Optional overview of how this project is structured"
          defaultValue={summary ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`architecture-mermaid-${projectId}`}>
          Mermaid source
        </Label>
        <Textarea
          id={`architecture-mermaid-${projectId}`}
          name="mermaidSource"
          rows={14}
          required
          className="font-mono text-xs leading-relaxed"
          defaultValue={mermaidSource}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
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
