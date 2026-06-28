import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, featureStatusBadgeVariant } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeatureProjectFilter } from "@/components/features/feature-project-filter";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildFeaturesListHref,
  getFeatureEmptyStateCopy,
} from "@/lib/features-filter";
import { featureStatusLabel, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { featureStatuses } from "@/lib/validations/feature";
import { listFeatures } from "@/services/features";
import { listProjects } from "@/services/projects";
type Props = {
  searchParams: Promise<{ status?: string; projectId?: string }>;
};

function isFeatureStatus(s: string): s is (typeof featureStatuses)[number] {
  return (featureStatuses as readonly string[]).includes(s);
}

export default async function FeaturesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const statusFilter =
    sp.status && isFeatureStatus(sp.status) ? sp.status : undefined;
  const projectIdFilter =
    typeof sp.projectId === "string" && sp.projectId ? sp.projectId : undefined;

  const [features, projects] = await Promise.all([
    listFeatures({ status: statusFilter, projectId: projectIdFilter }),
    listProjects(),
  ]);

  const filteredProject = projectIdFilter
    ? projects.find((p) => p.id === projectIdFilter)
    : undefined;

  const emptyState = getFeatureEmptyStateCopy({
    status: statusFilter,
    projectId: projectIdFilter,
    projectName: filteredProject?.name,
    statusLabel: statusFilter ? featureStatusLabel(statusFilter) : undefined,
  });

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Features" },
        ]}
        title="Features"
        description="Backlog and specs you can hand to an agent or implement yourself."
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

      <div className="surface-panel mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="meta-label">Status</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFeaturesListHref({ projectId: projectIdFilter })}
              className={cn(
                buttonVariants({
                  variant: !statusFilter ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              All
            </Link>
            {featureStatuses.map((s) => (
              <Link
                key={s}
                href={buildFeaturesListHref({
                  status: s,
                  projectId: projectIdFilter,
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
        </div>
        <div className="space-y-2 lg:w-56 lg:shrink-0">
          <p className="meta-label">Project</p>
          <FeatureProjectFilter
            projects={projects.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
            }))}
            projectId={projectIdFilter}
            status={statusFilter}
          />
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
        <div className="space-y-2">
          {features.map((f) => (
            <Link key={f.id} href={`/features/${f.id}`}>
              <Card className="surface-card-interactive">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="font-heading text-base">{f.title}</CardTitle>
                    <StatusBadge variant={featureStatusBadgeVariant(f.status)}>
                      {featureStatusLabel(f.status)}
                    </StatusBadge>
                  </div>
                  <CardDescription>
                    {f.project.name} · updated {formatRelativeTime(f.updatedAt)}
                  </CardDescription>
                </CardHeader>
                {f.description ? (
                  <CardContent className="pt-0 text-sm text-muted-foreground line-clamp-2">
                    {f.description}
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
