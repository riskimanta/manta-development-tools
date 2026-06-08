import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkProgressSessionList } from "@/components/projects/work-progress-session-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWorkProgressSessionsPageData } from "@/services/work-progress";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectWorkProgressPage({ params }: Props) {
  const { id } = await params;
  const data = await getWorkProgressSessionsPageData(id);

  if (!data) {
    notFound();
  }

  const { project, sessions, entryCount } = data;

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
          <CardDescription>
            Sessions are derived from existing snapshots. No explicit start/stop
            session model yet.
          </CardDescription>
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
              ? "No snapshots captured yet."
              : `${entryCount} snapshot${entryCount === 1 ? "" : "s"} grouped into ${sessions.length} session${sessions.length === 1 ? "" : "s"}.`}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">
          Work progress sessions
        </h2>
        {sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No work progress sessions yet. Capture progress from Project Detail
              or run <code className="font-mono">mandev track</code>.
            </CardContent>
          </Card>
        ) : (
          <WorkProgressSessionList sessions={sessions} />
        )}
      </section>
    </>
  );
}
