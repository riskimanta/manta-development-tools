import Link from "next/link";
import { ArrowRight, FolderKanban, ListTodo, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkList, LinkListCard } from "@/components/ui/link-list-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
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
        <StatCard
          label="Projects"
          value={data.projectCount}
          hint="Registered in ManDev"
        />
        <StatCard
          label="Features"
          value={featureTotal}
          hint="Across all projects"
          className="sm:col-span-1"
        >
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["draft", "ready", "in_progress", "done"].map((s) => (
              <StatusBadge
                key={s}
                variant={
                  s === "done"
                    ? "done"
                    : s === "in_progress"
                      ? "in_progress"
                      : s === "ready"
                        ? "ready"
                        : "draft"
                }
              >
                {featureStatusLabel(s)}: {data.featuresByStatus[s] ?? 0}
              </StatusBadge>
            ))}
          </div>
        </StatCard>
        <StatCard
          label="Quick actions"
          value={
            <span className="text-lg font-medium sm:text-xl">Get started</span>
          }
          className="sm:col-span-2 lg:col-span-2"
        >
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/projects/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center gap-1.5",
              )}
            >
              <Plus className="size-3.5" />
              New project
            </Link>
            <Link
              href="/features/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center gap-1.5",
              )}
            >
              <Plus className="size-3.5" />
              New feature
            </Link>
            <Link
              href="/backlog"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "inline-flex items-center gap-1.5 text-muted-foreground",
              )}
            >
              View backlog
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </StatCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionHeader
            title="Recent projects"
            action={{ label: "View all", href: "/projects" }}
          />
          {data.recentProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Add your first repository or app to start tracking features."
            >
              <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
                Add project
              </Link>
            </EmptyState>
          ) : (
            <LinkList>
              {data.recentProjects.map((p) => (
                <li key={p.id}>
                  <LinkListCard
                    href={`/projects/${p.id}`}
                    icon={FolderKanban}
                    title={p.name}
                    meta={`${p._count.features} features · updated ${formatRelativeTime(p.updatedAt)}`}
                  />
                </li>
              ))}
            </LinkList>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Recent features"
            action={{ label: "View all", href: "/features" }}
          />
          {data.recentFeatures.length === 0 ? (
            <EmptyState
              title="No features yet"
              description="Capture specs and status for work you route to Cursor or PRs."
            >
              <Link href="/features/new" className={buttonVariants({ size: "sm" })}>
                Add feature
              </Link>
            </EmptyState>
          ) : (
            <LinkList>
              {data.recentFeatures.map((f) => (
                <li key={f.id}>
                  <LinkListCard
                    href={`/features/${f.id}`}
                    icon={ListTodo}
                    title={f.title}
                    meta={`${f.project.name} · ${featureStatusLabel(f.status)} · ${formatRelativeTime(f.updatedAt)}`}
                  />
                </li>
              ))}
            </LinkList>
          )}
        </section>
      </div>
    </>
  );
}
