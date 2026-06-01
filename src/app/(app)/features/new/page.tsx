import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureCreateForm } from "@/components/features/feature-create-form";
import { resolveDefaultFeatureProjectId } from "@/lib/feature-new-href";
import { cn } from "@/lib/utils";
import { listProjects } from "@/services/projects";

type Props = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function NewFeaturePage({ searchParams }: Props) {
  const sp = await searchParams;
  const requestedProjectId =
    typeof sp.projectId === "string" && sp.projectId ? sp.projectId : undefined;

  const projects = await listProjects({ name: "asc" });
  const options = projects.map((p) => ({ id: p.id, name: p.name }));
  const defaultProjectId = resolveDefaultFeatureProjectId(
    requestedProjectId,
    options.map((p) => p.id),
  );

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Features", href: "/features" },
          { label: "New" },
        ]}
        title="New feature"
        description="Capture intent in ManDev before opening the target repo in Cursor."
        actions={
          <Link
            href="/features"
            className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}
          >
            Cancel
          </Link>
        }
      />

      {options.length === 0 ? (
        <EmptyState
          title="Create a project first"
          description="Features must belong to a project. Add a project, then return here."
        >
          <Link href="/projects/new" className={buttonVariants()}>
            New project
          </Link>
        </EmptyState>
      ) : (
        <FeatureCreateForm
          projects={options}
          defaultProjectId={defaultProjectId}
        />
      )}
    </>
  );
}
