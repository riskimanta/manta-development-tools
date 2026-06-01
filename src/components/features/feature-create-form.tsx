"use client";

import { useActionState } from "react";

import { createFeature, type FeatureActionState } from "@/app/features/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { featureStatusLabel } from "@/lib/format";
import { selectClassName } from "@/lib/form-classes";
import { featureStatuses } from "@/lib/validations/feature";

type ProjectOption = { id: string; name: string };

const initialState: FeatureActionState | undefined = undefined;

export function FeatureCreateForm({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createFeature,
    initialState,
  );

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-6">
      <FieldErrors errors={state?.fieldErrors} />
      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <select
          id="projectId"
          name="projectId"
          required
          className={selectClassName}
          defaultValue={defaultProjectId ?? projects[0]?.id}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="Feature name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Acceptance criteria, notes for implementation…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" className={selectClassName} defaultValue="draft">
          {featureStatuses.map((s) => (
            <option key={s} value={s}>
              {featureStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Priority (0–100, optional)</Label>
        <Input
          id="priority"
          name="priority"
          type="number"
          min={0}
          max={100}
          placeholder="e.g. 10"
        />
      </div>
      <Button type="submit" disabled={pending || !projects.length}>
        {pending ? "Creating…" : "Create feature"}
      </Button>
    </form>
  );
}
