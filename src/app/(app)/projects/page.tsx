import Link from "next/link";
import { Plus } from "lucide-react";

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
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listProjects } from "@/services/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects" },
        ]}
        title="Projects"
        description="Register every codebase or product that connects to ManDev."
        actions={
          <Link
            href="/projects/new"
            className={cn(buttonVariants(), "inline-flex items-center gap-2")}
          >
            <Plus className="size-4" />
            New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to attach features, repo links, and local paths."
        >
          <Link href="/projects/new" className={buttonVariants()}>
            Create project
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition-colors hover:border-primary/25 hover:bg-muted/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-heading text-lg">{p.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {p._count.features} features
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {p.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-2">
                    {p.description ?? "No description yet."}
                  </p>
                  <p className="mt-3 text-xs">
                    Updated {formatRelativeTime(p.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
