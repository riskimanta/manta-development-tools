import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { DeleteFeatureButton } from "@/components/features/delete-feature-button";
import { FeatureCursorPromptActions } from "@/components/features/feature-cursor-prompt-actions";
import { FeatureEditForm } from "@/components/features/feature-edit-form";
import { SectionHeader } from "@/components/ui/section-header";
import {
  StatusBadge,
  featureStatusBadgeVariant,
} from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { featureStatusLabel, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getFeatureById } from "@/services/features";
import { listProjects } from "@/services/projects";

type Props = { params: Promise<{ id: string }> };

export default async function FeatureDetailPage({ params }: Props) {
  const { id } = await params;
  const [feature, projects] = await Promise.all([
    getFeatureById(id),
    listProjects({ name: "asc" }),
  ]);
  if (!feature) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Features", href: "/features" },
          { label: feature.title },
        ]}
        title={feature.title}
        description={`${feature.project.name} · ${featureStatusLabel(feature.status)} · updated ${formatRelativeTime(feature.updatedAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${feature.projectId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View project
            </Link>
            <DeleteFeatureButton featureId={feature.id} />
          </div>
        }
      />

      {feature.description ? (
        <Card className="surface-card mb-8">
          <CardContent className="py-4">
            <p className="meta-label mb-2">Description</p>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <SectionHeader title="Edit feature" />
          <FeatureEditForm
            feature={{
              id: feature.id,
              projectId: feature.projectId,
              title: feature.title,
              description: feature.description,
              status: feature.status,
              priority: feature.priority,
            }}
            projects={projectOptions}
          />
        </section>

        <aside className="space-y-4">
          <FeatureCursorPromptActions
            project={{
              name: feature.project.name,
              slug: feature.project.slug,
              repoUrl: feature.project.repoUrl,
              localPath: feature.project.localPath,
            }}
            feature={{
              title: feature.title,
              status: feature.status,
              priority: feature.priority,
              description: feature.description,
            }}
          />

          <Card className="surface-card">
            <CardContent className="space-y-3 py-4">
              <p className="meta-label">Meta</p>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge variant={featureStatusBadgeVariant(feature.status)}>
                      {featureStatusLabel(feature.status)}
                    </StatusBadge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Priority</dt>
                  <dd className="mt-1 font-mono text-xs">
                    {feature.priority ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Project</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/projects/${feature.projectId}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {feature.project.name}
                    </Link>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
