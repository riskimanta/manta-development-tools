"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Expand, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { buildArchitectureImportCursorPrompt } from "@/lib/architecture-import-template";
import { isArchitectureSummaryLong } from "@/lib/architecture-viewer";
import { cn } from "@/lib/utils";
import { ProjectArchitectureForm } from "@/components/projects/project-architecture-form";
import { ProjectArchitectureImport } from "@/components/projects/project-architecture-import";
import { MermaidDiagram } from "@/components/projects/mermaid-diagram";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

type Architecture = {
  summary: string | null;
  mermaidSource: string;
};

type ProjectContext = {
  id: string;
  name: string;
  repoUrl: string | null;
  localPath: string | null;
};

type Props = {
  project: ProjectContext;
  architecture: Architecture | null;
  defaultMermaidSource: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ArchitectureSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = isArchitectureSummaryLong(text);

  return (
    <div className="space-y-1">
      <p
        className={cn(
          "text-sm whitespace-pre-wrap text-muted-foreground",
          !expanded && isLong && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {isLong ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs text-muted-foreground"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : "Show full summary"}
        </Button>
      ) : null}
    </div>
  );
}

export function ProjectArchitectureCard({
  project,
  architecture,
  defaultMermaidSource,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullDiagramOpen, setFullDiagramOpen] = useState(false);

  const handleSaveSuccess = useCallback(() => {
    setCreating(false);
    setEditing(false);
  }, []);

  async function handleCopyMermaid() {
    if (!architecture) {
      return;
    }

    const ok = await copyText(architecture.mermaidSource);
    if (ok) {
      toast.success("Mermaid source copied to clipboard");
    } else {
      toast.error("Could not copy Mermaid source");
    }
  }

  const aiArchitecturePrompt = useMemo(
    () =>
      buildArchitectureImportCursorPrompt({
        name: project.name,
        localPath: project.localPath,
        repoUrl: project.repoUrl,
      }),
    [project.name, project.localPath, project.repoUrl],
  );

  async function handleCopyAiArchitecturePrompt() {
    const ok = await copyText(aiArchitecturePrompt);
    if (ok) {
      toast.success("AI architecture prompt copied");
    } else {
      toast.error("Could not copy AI architecture prompt");
    }
  }

  const showForm = creating || editing;
  const hasArchitecture = architecture !== null;

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Architecture</CardTitle>
        <CardDescription>
          Document how this project is structured with a Mermaid diagram.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProjectArchitectureImport
          projectId={project.id}
          localPath={project.localPath}
        />

        {!hasArchitecture && !creating ? (
          <EmptyState
            title="No architecture diagram yet"
            description="Generate the architecture file with Cursor, then read it back from the local path."
            className="py-10"
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleCopyAiArchitecturePrompt}
              >
                <Sparkles className="size-3.5" />
                Copy AI architecture prompt
              </Button>
              <Button type="button" size="sm" onClick={() => setCreating(true)}>
                Create architecture diagram
              </Button>
            </div>
          </EmptyState>
        ) : null}

        {showForm ? (
          <ProjectArchitectureForm
            projectId={project.id}
            summary={architecture?.summary}
            mermaidSource={
              architecture?.mermaidSource ?? defaultMermaidSource
            }
            submitLabel={
              hasArchitecture ? "Save changes" : "Create architecture diagram"
            }
            onCancel={
              hasArchitecture
                ? () => setEditing(false)
                : () => setCreating(false)
            }
            onSuccess={handleSaveSuccess}
          />
        ) : null}

        {hasArchitecture && !showForm ? (
          <>
            {architecture.summary ? (
              <ArchitectureSummary text={architecture.summary} />
            ) : null}

            <div className="space-y-2">
              <MermaidDiagram
                source={architecture.mermaidSource}
                variant="compact"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFullDiagramOpen(true)}
              >
                <Expand className="size-3.5" />
                View full diagram
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleCopyMermaid}
              >
                <Copy className="size-3.5" />
                Copy Mermaid
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>

            <details className="group rounded-md border border-border/80 bg-muted/20">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                View Mermaid source
              </summary>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-border/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90">
                {architecture.mermaidSource}
              </pre>
            </details>

            <Dialog open={fullDiagramOpen} onOpenChange={setFullDiagramOpen}>
              <DialogContent
                showCloseButton
                className="flex max-h-[min(92vh,900px)] w-[calc(100%-2rem)] max-w-4xl flex-col gap-4 overflow-hidden sm:max-w-4xl"
              >
                <DialogHeader>
                  <DialogTitle>Architecture diagram</DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MermaidDiagram
                    source={architecture.mermaidSource}
                    variant="full"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
