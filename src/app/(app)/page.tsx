import Link from "next/link";
import { ArrowRight, FolderKanban, ListTodo } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { featureStatusLabel, formatRelativeTime } from "@/lib/format";
import { getDashboardOverview } from "@/services/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardOverview();
  const featureTotal = Object.values(data.featuresByStatus).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <>
      <PageHeader
        items={[{ label: "Dashboard", href: "/" }]}
        title="Overview"
        description="Track connected projects and feature workstreams from one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {data.projectCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Registered in ManDev
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur-sm sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Features by status</CardDescription>
            <CardTitle className="font-heading text-lg">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {["draft", "ready", "in_progress", "done"].map((s) => (
              <Badge key={s} variant="secondary" className="tabular-nums">
                {featureStatusLabel(s)}: {data.featuresByStatus[s] ?? 0}
              </Badge>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              Total {featureTotal}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Quick actions</CardDescription>
            <CardTitle className="font-heading text-base">Navigate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/projects/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex w-full items-center justify-between gap-2",
              )}
            >
              New project
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/features/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex w-full items-center justify-between gap-2",
              )}
            >
              New feature
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Recent projects
            </h2>
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground",
              )}
            >
              View all
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Add your first repository or app to start tracking features."
            >
              <Link href="/projects/new" className={buttonVariants()}>
                Add project
              </Link>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {data.recentProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`}>
                    <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
                      <CardContent className="flex items-center gap-3 py-4">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <FolderKanban className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p._count.features} features · updated{" "}
                            {formatRelativeTime(p.updatedAt)}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Recent features
            </h2>
            <Link
              href="/features"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground",
              )}
            >
              View all
            </Link>
          </div>
          {data.recentFeatures.length === 0 ? (
            <EmptyState
              title="No features yet"
              description="Capture specs and status for work you route to Cursor or PRs."
            >
              <Link href="/features/new" className={buttonVariants()}>
                Add feature
              </Link>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {data.recentFeatures.map((f) => (
                <li key={f.id}>
                  <Link href={`/features/${f.id}`}>
                    <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
                      <CardContent className="flex items-start gap-3 py-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <ListTodo className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{f.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.project.name} ·{" "}
                            {featureStatusLabel(f.status)} ·{" "}
                            {formatRelativeTime(f.updatedAt)}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
