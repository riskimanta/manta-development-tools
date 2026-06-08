import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkProgressSessionDetail } from "@/components/projects/work-progress-session-detail";
import { buttonVariants } from "@/components/ui/button";
import { formatWorkProgressSessionTitle } from "@/lib/work-progress-session-ui";
import { cn } from "@/lib/utils";
import { getWorkProgressSessionDetailPageData } from "@/services/work-progress";

type Props = {
  params: Promise<{ id: string; sessionId: string }>;
};

export default async function WorkProgressSessionDetailPage({ params }: Props) {
  const { id: projectId, sessionId } = await params;
  const data = await getWorkProgressSessionDetailPageData(projectId, sessionId);

  if (!data) {
    notFound();
  }

  const { project, session } = data;

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          {
            label: "Work progress",
            href: `/projects/${project.id}/work-progress`,
          },
          { label: "Session detail" },
        ]}
        title={formatWorkProgressSessionTitle(session.branch)}
        description={`${project.name} — derived work progress session detail`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${project.id}/work-progress`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center gap-1.5",
              )}
            >
              <ArrowLeft className="size-3.5" />
              Back to work progress
            </Link>
            <Link
              href={`/projects/${project.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to project
            </Link>
          </div>
        }
      />

      <WorkProgressSessionDetail session={session} />
    </>
  );
}
