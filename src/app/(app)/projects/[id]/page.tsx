import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ProjectArchitectureCard } from "@/components/projects/project-architecture-card";
import { ProjectRunProfilesCard } from "@/components/projects/project-run-profiles-card";
import { ProjectWorkProgressCard } from "@/components/projects/project-work-progress-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ProjectEditForm } from "@/components/projects/project-edit-form";
import { ProjectLocalPathActions } from "@/components/projects/project-local-path-actions";
import { buildDefaultArchitectureTemplate } from "@/lib/architecture-template";
import { isCommandExecutionEnabled } from "@/lib/mandev-command-execution";
import { featureStatusLabel, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getProjectArchitecture } from "@/services/architectures";
import { getProjectById } from "@/services/projects";
import { listRunProfilesWithRecentRunsByProjectId } from "@/services/run-profiles";
import { listWorkProgressByProjectId } from "@/services/work-progress";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const [architecture, runProfiles, workProgressEntries] = await Promise.all([
    getProjectArchitecture(project.id),
    listRunProfilesWithRecentRunsByProjectId(project.id),
    listWorkProgressByProjectId(project.id),
  ]);
  const defaultMermaidSource = buildDefaultArchitectureTemplate({
    name: project.name,
    repoUrl: project.repoUrl,
    localPath: project.localPath,
  });

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
        title={project.name}
        description={project.description ?? "No description yet."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "inline-flex items-center gap-1.5",
                )}
              >
                Repository
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            <Link
              href={`/features/new?projectId=${project.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              New feature
            </Link>
            <DeleteProjectButton projectId={project.id} />
          </div>
        }
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Details</h2>
          <ProjectEditForm project={project} />
          {project.localPath ? (
            <ProjectLocalPathActions localPath={project.localPath} />
          ) : null}
          <ProjectWorkProgressCard
            projectId={project.id}
            localPath={project.localPath}
            entries={workProgressEntries}
          />
          <ProjectRunProfilesCard
            projectId={project.id}
            projectName={project.name}
            projectLocalPath={project.localPath}
            projectRepoUrl={project.repoUrl}
            profiles={runProfiles}
            commandExecutionEnabled={isCommandExecutionEnabled()}
          />
          <ProjectArchitectureCard
            project={{
              id: project.id,
              name: project.name,
              repoUrl: project.repoUrl,
              localPath: project.localPath,
            }}
            architecture={
              architecture
                ? {
                    summary: architecture.summary,
                    mermaidSource: architecture.mermaidSource,
                  }
                : null
            }
            defaultMermaidSource={defaultMermaidSource}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Features</h2>
            <Link
              href={`/features/new?projectId=${project.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Add
            </Link>
          </div>
          {project.features.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No features for this project yet.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {project.features.map((f) => (
                <li key={f.id}>
                  <Link href={`/features/${f.id}`}>
                    <Card className="transition-colors hover:bg-muted/30">
                      <CardHeader className="space-y-1 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base font-medium">
                            {f.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {featureStatusLabel(f.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        Updated {formatRelativeTime(f.updatedAt)}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
