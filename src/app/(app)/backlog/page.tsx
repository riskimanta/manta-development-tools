import Link from "next/link";
import { Plus } from "lucide-react";

import { BacklogPriorityFilter } from "@/components/backlog/backlog-priority-filter";
import { FeatureProjectFilter } from "@/components/features/feature-project-filter";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildBacklogListHref,
  getBacklogEmptyStateCopy,
  groupOtherBacklogByProject,
  isFeaturePriorityBand,
  isFeatureStatus,
  MANDEV_PROJECT_CALLOUT,
  MANDEV_PROJECT_SLUG,
  priorityBandLabel,
  splitBacklogByMandev,
} from "@/lib/backlog";
import { buildFeatureNewHref } from "@/lib/feature-new-href";
import { featureStatusLabel, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { featureStatuses } from "@/lib/validations/feature";
import { listFeatures } from "@/services/features";
import { getProjectBySlug, listProjects } from "@/services/projects";

type Props = {
  searchParams: Promise<{
    status?: string;
    projectId?: string;
    priority?: string;
  }>;
};

function BacklogItemCard({
  title,
  status,
  description,
  projectName,
  updatedAt,
  priority,
  href,
  variant,
}: {
  title: string;
  status: string;
  description: string | null;
  projectName: string;
  updatedAt: Date;
  priority: number | null;
  href: string;
  variant: "mandev" | "project";
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "transition-colors hover:border-primary/25 hover:bg-muted/20",
          variant === "mandev" && "border-primary/20 bg-primary/[0.03]",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-heading text-base">{title}</CardTitle>
            <Badge variant="outline">{featureStatusLabel(status)}</Badge>
            {priority != null ? (
              <Badge variant="secondary">P{priority}</Badge>
            ) : null}
          </div>
          <CardDescription>
            {projectName} · updated {formatRelativeTime(updatedAt)}
          </CardDescription>
        </CardHeader>
        {description ? (
          <CardContent className="pt-0 text-sm text-muted-foreground line-clamp-2">
            {description}
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}

export default async function BacklogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const statusFilter =
    sp.status && isFeatureStatus(sp.status) ? sp.status : undefined;
  const projectIdFilter =
    typeof sp.projectId === "string" && sp.projectId ? sp.projectId : undefined;
  const priorityFilter =
    sp.priority && isFeaturePriorityBand(sp.priority) ? sp.priority : undefined;

  const [features, projects, mandevProject] = await Promise.all([
    listFeatures({
      status: statusFilter,
      projectId: projectIdFilter,
      priorityBand: priorityFilter,
      excludeDone: !statusFilter,
    }),
    listProjects(),
    getProjectBySlug(MANDEV_PROJECT_SLUG),
  ]);

  const hasMandevProject = Boolean(mandevProject);
  const filteredProject = projectIdFilter
    ? projects.find((p) => p.id === projectIdFilter)
    : undefined;

  const emptyState = getBacklogEmptyStateCopy({
    status: statusFilter,
    projectId: projectIdFilter,
    projectName: filteredProject?.name,
    statusLabel: statusFilter ? featureStatusLabel(statusFilter) : undefined,
    priorityBand: priorityFilter,
    priorityLabel: priorityFilter ? priorityBandLabel(priorityFilter) : undefined,
  });

  const { mandev, other } = splitBacklogByMandev(features);
  const otherByProject = groupOtherBacklogByProject(other);

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }));

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Backlog" },
        ]}
        title="Backlog"
        description="Planning view across projects. Open Features for full spec management."
        actions={
          <Link
            href="/features/new"
            className={cn(buttonVariants(), "inline-flex items-center gap-2")}
          >
            <Plus className="size-4" />
            New feature
          </Link>
        }
      />

      {!hasMandevProject ? (
        <div
          className="mb-6 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          {MANDEV_PROJECT_CALLOUT}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildBacklogListHref({
                projectId: projectIdFilter,
                priority: priorityFilter,
              })}
              className={cn(
                buttonVariants({
                  variant: !statusFilter ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              Open
            </Link>
            {featureStatuses.map((s) => (
              <Link
                key={s}
                href={buildBacklogListHref({
                  status: s,
                  projectId: projectIdFilter,
                  priority: priorityFilter,
                })}
                className={cn(
                  buttonVariants({
                    variant: statusFilter === s ? "default" : "outline",
                    size: "sm",
                  }),
                )}
              >
                {featureStatusLabel(s)}
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Open shows all non-done items. Pick a status to include done work.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2 sm:w-56">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project
            </p>
            <FeatureProjectFilter
              projects={projectOptions}
              projectId={projectIdFilter}
              status={statusFilter}
              priority={priorityFilter}
              listTarget="backlog"
              ariaLabel="Filter backlog by project"
            />
          </div>
          <div className="space-y-2 sm:w-56">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Priority
            </p>
            <BacklogPriorityFilter
              priority={priorityFilter}
              status={statusFilter}
              projectId={projectIdFilter}
            />
          </div>
        </div>
      </div>

      {features.length === 0 ? (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {emptyState.actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={cn(
                  buttonVariants({
                    variant: action.variant ?? "default",
                  }),
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {hasMandevProject && mandevProject ? (
            <section aria-labelledby="backlog-mandev-heading">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="backlog-mandev-heading"
                    className="font-heading text-lg font-semibold tracking-tight"
                  >
                    ManDev product backlog
                  </h2>
                  <Badge>Internal</Badge>
                </div>
                <Link
                  href={buildFeatureNewHref({ projectId: mandevProject.id })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "inline-flex items-center gap-1.5",
                  )}
                >
                  <Plus className="size-3.5" />
                  New ManDev backlog item
                </Link>
              </div>
              {mandev.length > 0 ? (
                <div className="space-y-2">
                  {mandev.map((f) => (
                    <BacklogItemCard
                      key={f.id}
                      href={`/features/${f.id}`}
                      title={f.title}
                      status={f.status}
                      description={f.description}
                      projectName={f.project.name}
                      updatedAt={f.updatedAt}
                      priority={f.priority}
                      variant="mandev"
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {otherByProject.length > 0 ? (
            <section aria-labelledby="backlog-other-heading">
              <h2
                id="backlog-other-heading"
                className="mb-4 font-heading text-lg font-semibold tracking-tight"
              >
                Other project backlogs
              </h2>
              <div className="space-y-6">
                {otherByProject.map(({ project, items }) => (
                  <div key={project.id}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground">
                          {project.name}
                        </h3>
                        <Badge variant="outline">{project.slug}</Badge>
                      </div>
                      <Link
                        href={buildFeatureNewHref({ projectId: project.id })}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-auto px-2 py-1 text-xs",
                        )}
                      >
                        New item for this project
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {items.map((f) => (
                        <BacklogItemCard
                          key={f.id}
                          href={`/features/${f.id}`}
                          title={f.title}
                          status={f.status}
                          description={f.description}
                          projectName={f.project.name}
                          updatedAt={f.updatedAt}
                          priority={f.priority}
                          variant="project"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
