import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
import {
  formatRunProfileRunDuration,
  formatRunProfileRunExitSummary,
  formatRunProfileRunPid,
  formatRunProfileRunTimestamp,
  runProfileRunStatusLabel,
  runProfileRunStatusVariant,
} from "@/lib/run-profile-run-history-ui";
import { cn } from "@/lib/utils";
import { getRunProfileRunDetailPageData } from "@/services/run-profiles";

type Props = {
  params: Promise<{ id: string; runProfileId: string; runId: string }>;
};

const previewCodeClassName =
  "mt-1 block max-h-96 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-3 py-2 font-mono text-xs text-foreground/90";

function LogPreviewSection({
  label,
  preview,
}: {
  label: string;
  preview: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {preview ? (
        <pre className={previewCodeClassName}>
          <code>{preview}</code>
        </pre>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No output captured.</p>
      )}
    </div>
  );
}

export default async function RunProfileRunDetailPage({ params }: Props) {
  const { id: projectId, runProfileId, runId } = await params;
  const data = await getRunProfileRunDetailPageData(
    projectId,
    runProfileId,
    runId,
  );

  if (!data) {
    notFound();
  }

  const { project, profile, run } = data;
  const exitSummary = formatRunProfileRunExitSummary(run.exitCode, run.signal);
  const startedAt = formatRunProfileRunTimestamp(run.startedAt);
  const endedAt = formatRunProfileRunTimestamp(run.endedAt);
  const allRunsHref = `/projects/${project.id}/run-profiles/${profile.id}/runs`;

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: profile.name, href: allRunsHref },
          { label: "Run detail" },
        ]}
        title={`${profile.name} — run detail`}
        description={`Persisted run record from ${startedAt ?? "unknown start time"}.`}
        actions={
          <Link
            href={allRunsHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center gap-1.5",
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back to all runs
          </Link>
        }
      />

      <Card className="mb-6">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base font-medium">{profile.name}</CardTitle>
          <CardDescription>
            {project.name} · Run profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Command
            </p>
            <code className={previewCodeClassName}>{profile.command}</code>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Working directory
            </p>
            {profile.workingDirectory ? (
              <code className={previewCodeClassName}>
                {profile.workingDirectory}
              </code>
            ) : (
              <p className="text-sm text-muted-foreground">Not configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-medium">Run record</CardTitle>
            <Badge
              variant={runProfileRunStatusVariant(run.status)}
              className="text-[10px] uppercase"
            >
              {runProfileRunStatusLabel(run.status)}
            </Badge>
          </div>
          <CardDescription>
            PID {formatRunProfileRunPid(run.pid)}
            {exitSummary ? ` · ${exitSummary}` : ""}
            {" · "}
            {formatRunProfileRunDuration(run)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Started
              </p>
              <p>{startedAt ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ended
              </p>
              <p>{endedAt ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p>{formatRunProfileRunDuration(run)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Exit / signal
              </p>
              <p>{exitSummary ?? "—"}</p>
            </div>
          </div>

          <LogPreviewSection label="stdout" preview={run.stdoutPreview} />
          <LogPreviewSection label="stderr" preview={run.stderrPreview} />
        </CardContent>
      </Card>
    </>
  );
}
