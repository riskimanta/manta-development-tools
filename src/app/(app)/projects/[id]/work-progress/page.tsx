import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkProgressSessionFilters } from "@/components/projects/work-progress-session-filters";
import { WorkProgressSessionList } from "@/components/projects/work-progress-session-list";
import { WorkProgressUsageGuide } from "@/components/projects/work-progress-usage-guide";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildWorkProgressSessionsListHref,
  formatWorkProgressSessionFilterCountLabel,
} from "@/lib/work-progress-session-filter";
import {
  WORK_PROGRESS_DERIVED_SESSION_NOTICE,
  WORK_PROGRESS_NO_CAPTURE_NO_LOCAL_PATH_HINT,
  WORK_PROGRESS_NO_CAPTURE_WITH_LOCAL_PATH_HINT,
  WORK_PROGRESS_NO_CAPTURE_YET_LABEL,
  WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_HINT,
  WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_LABEL,
} from "@/lib/work-progress-session-ui";
import { cn } from "@/lib/utils";
import { getWorkProgressSessionsPageData } from "@/services/work-progress";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    branch?: string;
    status?: string;
    summary?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function ProjectWorkProgressPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const data = await getWorkProgressSessionsPageData(id, sp);

  if (!data) {
    notFound();
  }

  const {
    project,
    sessions,
    entryCount,
    totalSessionCount,
    filteredCount,
    branchOptions,
    filters,
  } = data;

  const hasLocalPath = Boolean(project.localPath?.trim());
  const noCaptureHint = hasLocalPath
    ? WORK_PROGRESS_NO_CAPTURE_WITH_LOCAL_PATH_HINT
    : WORK_PROGRESS_NO_CAPTURE_NO_LOCAL_PATH_HINT;
  const clearFiltersHref = buildWorkProgressSessionsListHref(project.id);

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Work progress" },
        ]}
        title={`${project.name} — work progress`}
        description="Derived development sessions grouped from Work Progress snapshots."
        actions={
          <Link
            href={`/projects/${project.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center gap-1.5",
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back to project
          </Link>
        }
      />

      <Card className="mb-6">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base font-medium">Project context</CardTitle>
          <CardDescription>{WORK_PROGRESS_DERIVED_SESSION_NOTICE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Local path
            </p>
            {project.localPath ? (
              <code className="mt-1 block break-all rounded bg-muted/80 px-2 py-1 font-mono text-xs text-foreground/90">
                {project.localPath}
              </code>
            ) : (
              <p className="mt-1 text-muted-foreground">Not configured</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {entryCount === 0
              ? WORK_PROGRESS_NO_CAPTURE_YET_LABEL
              : `${entryCount} snapshot${entryCount === 1 ? "" : "s"} grouped into ${totalSessionCount} session${totalSessionCount === 1 ? "" : "s"}.`}
          </p>
        </CardContent>
      </Card>

      <WorkProgressUsageGuide className="mb-6" />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">
            Work progress sessions
          </h2>
          {totalSessionCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {formatWorkProgressSessionFilterCountLabel(
                filteredCount,
                totalSessionCount,
              )}
            </p>
          ) : null}
        </div>

        {entryCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p>{WORK_PROGRESS_NO_CAPTURE_YET_LABEL}</p>
              <p className="text-xs">{noCaptureHint}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <WorkProgressSessionFilters
              projectId={project.id}
              filters={filters}
              branchOptions={branchOptions}
            />

            {filteredCount === 0 ? (
              <Card className="border-dashed">
                <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p>{WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_LABEL}</p>
                    <p className="text-xs">
                      {WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_HINT}
                    </p>
                  </div>
                  <Link
                    href={clearFiltersHref}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Clear filters
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <WorkProgressSessionList
                projectId={project.id}
                sessions={sessions}
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
