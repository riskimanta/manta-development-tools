"use client";

import { useActionState } from "react";

import { createProject, type ActionState } from "@/app/projects/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState | undefined = undefined;

export function ProjectCreateForm() {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-6">
      <FieldErrors errors={state?.fieldErrors} />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Expenses Tracker v3" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          placeholder="expenses-tracker-v3"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only"
        />
        <p className="text-xs text-muted-foreground">
          URL-safe identifier (lowercase, hyphens).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What this project is for…"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repoUrl">Repository URL</Label>
        <Input
          id="repoUrl"
          name="repoUrl"
          type="url"
          placeholder="https://github.com/you/repo"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="localPath">Local path (optional)</Label>
        <Input
          id="localPath"
          name="localPath"
          placeholder="/Users/you/Documents/my-app"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
