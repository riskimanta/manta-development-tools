import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectClassName } from "@/lib/form-classes";
import type { WorkProgressSessionFilters } from "@/lib/work-progress-session-filter";
import { buildWorkProgressSessionsListHref } from "@/lib/work-progress-session-filter";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  filters: WorkProgressSessionFilters;
  branchOptions: string[];
};

export function WorkProgressSessionFilters({
  projectId,
  filters,
  branchOptions,
}: Props) {
  const clearHref = buildWorkProgressSessionsListHref(projectId);

  return (
    <form
      method="get"
      action={`/projects/${projectId}/work-progress`}
      className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1.5 md:col-span-2 xl:col-span-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Search
          </span>
          <Input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search commit, file, branch, or summary..."
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Branch
          </span>
          <select
            name="branch"
            defaultValue={filters.branch ?? ""}
            className={cn(selectClassName, "h-8 w-full text-sm")}
          >
            <option value="">All branches</option>
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status ?? "all"}
            className={cn(selectClassName, "h-8 w-full text-sm")}
          >
            <option value="all">All statuses</option>
            <option value="clean">Clean</option>
            <option value="dirty">Dirty</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </span>
          <select
            name="summary"
            defaultValue={filters.summary ?? "all"}
            className={cn(selectClassName, "h-8 w-full text-sm")}
          >
            <option value="all">All summaries</option>
            <option value="has">Has summary</option>
            <option value="none">No summary</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            From
          </span>
          <Input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            To
          </span>
          <Input type="date" name="to" defaultValue={filters.to ?? ""} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        <Link
          href={clearHref}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Clear filters
        </Link>
      </div>
    </form>
  );
}
