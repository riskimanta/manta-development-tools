import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteFeatureButton } from "@/components/features/delete-feature-button";
import { FeatureCursorPromptActions } from "@/components/features/feature-cursor-prompt-actions";
import { FeatureEditForm } from "@/components/features/feature-edit-form";
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
        <div className="mb-8 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground">
            Description
          </p>
          <p className="whitespace-pre-wrap text-foreground/90">
            {feature.description}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-heading text-lg font-semibold">Edit</h2>
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
        </div>
        <aside className="space-y-6">
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

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Meta</h3>
            <div className="rounded-xl border border-border/80 bg-card/40 p-4 text-sm">
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-0.5">
                    <Badge>{featureStatusLabel(feature.status)}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Priority</dt>
                  <dd className="font-mono text-xs">
                    {feature.priority ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
