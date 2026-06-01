"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { updateProject, type ActionState } from "@/app/projects/actions";
import { FieldErrors } from "@/components/forms/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repoUrl: string | null;
  localPath: string | null;
};

const initialState: ActionState | undefined = undefined;

export function ProjectEditForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(updateProject, initialState);

  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description ?? "");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [localPath, setLocalPath] = useState(project.localPath ?? "");

  useEffect(() => {
    setName(project.name);
    setSlug(project.slug);
    setDescription(project.description ?? "");
    setRepoUrl(project.repoUrl ?? "");
    setLocalPath(project.localPath ?? "");
  }, [
    project.id,
    project.name,
    project.slug,
    project.description,
    project.repoUrl,
    project.localPath,
  ]);

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
    }
  }, [state?.ok, state?.message]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={project.id} />
      <FieldErrors errors={state?.fieldErrors} />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repoUrl">Repository URL</Label>
        <Input
          id="repoUrl"
          name="repoUrl"
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="localPath">Local path</Label>
        <Input
          id="localPath"
          name="localPath"
          value={localPath}
          onChange={(e) => setLocalPath(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
