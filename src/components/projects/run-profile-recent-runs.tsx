import Link from "next/link";

import { RefreshRecentRunsButton } from "@/components/projects/refresh-recent-runs-button";
import { RunProfileRunList } from "@/components/projects/run-profile-run-list";
import type { RunProfileRunRecord } from "@/lib/run-profile-run-history-types";
import { cn } from "@/lib/utils";

type Props = {
  recentRuns: RunProfileRunRecord[];
  viewAllHref?: string;
  className?: string;
};

export function RunProfileRecentRuns({
  recentRuns,
  viewAllHref,
  className,
}: Props) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">Recent runs</p>
        <div className="flex flex-wrap items-center gap-2">
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              View all runs
            </Link>
          ) : null}
          <RefreshRecentRunsButton />
        </div>
      </div>
      {recentRuns.length === 0 ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          No run history yet.
        </p>
      ) : (
        <RunProfileRunList
          runs={recentRuns}
          className={cn("mt-2 space-y-2")}
        />
      )}
    </div>
  );
}
