"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  updateFeature,
  type FeatureActionState,
} from "@/app/features/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { featureStatusLabel } from "@/lib/format";
import { selectClassName } from "@/lib/form-classes";
import { featureStatuses } from "@/lib/validations/feature";

type ProjectOption = { id: string; name: string };

type Feature = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: (typeof featureStatuses)[number];
  priority: number | null;
};

const initialState: FeatureActionState | undefined = undefined;

export function FeatureEditForm({
  feature,
  projects,
}: {
  feature: Feature;
  projects: ProjectOption[];
}) {
  const [state, formAction, pending] = useActionState(
    updateFeature,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
    }
  }, [state?.ok, state?.message]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={feature.id} />
      <FieldErrors errors={state?.fieldErrors} />
      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <select
          id="projectId"
          name="projectId"
          required
          className={selectClassName}
          defaultValue={feature.projectId}
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
        <Input
          id="title"
          name="title"
          required
          defaultValue={feature.title}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={feature.description ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className={selectClassName}
          defaultValue={feature.status}
        >
          {featureStatuses.map((s) => (
            <option key={s} value={s}>
              {featureStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Input
          id="priority"
          name="priority"
          type="number"
          min={0}
          max={100}
          defaultValue={feature.priority ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
