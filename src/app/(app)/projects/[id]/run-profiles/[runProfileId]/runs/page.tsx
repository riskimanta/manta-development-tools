import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { RunProfileRunList } from "@/components/projects/run-profile-run-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRunProfileRunHistoryPageData } from "@/services/run-profiles";

type Props = {
  params: Promise<{ id: string; runProfileId: string }>;
};

const previewCodeClassName =
  "mt-1 block break-all rounded bg-muted/80 px-2 py-1 font-mono text-xs text-foreground/90";

export default async function RunProfileRunHistoryPage({ params }: Props) {
  const { id: projectId, runProfileId } = await params;
  const data = await getRunProfileRunHistoryPageData(projectId, runProfileId);

  if (!data) {
    notFound();
  }

  const { project, profile, runs } = data;

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: profile.name },
          { label: "Run history" },
        ]}
        title={`${profile.name} — run history`}
        description="Persisted managed run records for this profile, newest first."
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
          <CardTitle className="text-base font-medium">{profile.name}</CardTitle>
          <CardDescription>Run profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No run history yet.</p>
        ) : (
          <RunProfileRunList runs={runs} className="space-y-2" />
        )}
      </section>
    </>
  );
}
