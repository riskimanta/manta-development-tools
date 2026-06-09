import { Badge } from "@/components/ui/badge";
import type { WorkProgressRecord } from "@/services/work-progress";
import { formatRelativeTime } from "@/lib/format";
import { WORK_PROGRESS_CLEAN_WORKING_TREE_LABEL } from "@/lib/work-progress-session-ui";

const statusCodeClassName =
  "inline-block min-w-[1.75rem] rounded bg-muted px-1 py-0.5 text-center font-mono text-[10px] text-foreground/90";

function WorkProgressEntry({ entry }: { entry: WorkProgressRecord }) {
  return (
    <li className="rounded border border-border/60 bg-background/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase">
          {entry.branch}
        </Badge>
        <span className="font-mono text-[10px] text-muted-foreground">
          {entry.latestCommitHash}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeTime(new Date(entry.createdAt))}
        </span>
      </div>

      <p className="text-sm text-foreground/90">{entry.summary}</p>

      <div className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground/80">Commit:</span>{" "}
          {entry.latestCommitMessage}
        </p>
        <p>
          <span className="font-medium text-foreground/80">Author:</span>{" "}
          {entry.latestCommitAuthor}
        </p>
      </div>

      {entry.changedFilesCount === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          {WORK_PROGRESS_CLEAN_WORKING_TREE_LABEL}
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            Changed files ({entry.changedFilesCount})
          </p>
          <ul className="max-h-32 space-y-1 overflow-auto">
            {entry.changedFiles.map((file) => (
              <li
                key={`${file.status}:${file.path}`}
                className="flex items-start gap-2 font-mono text-[10px] text-foreground/90"
              >
                <span className={statusCodeClassName}>{file.status}</span>
                <span className="break-all">{file.path}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.note ? (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">Note:</span>{" "}
          {entry.note}
        </p>
      ) : null}
    </li>
  );
}

type Props = {
  entries: WorkProgressRecord[];
  className?: string;
};

export function WorkProgressList({ entries, className }: Props) {
  return (
    <ul className={className}>
      {entries.map((entry) => (
        <WorkProgressEntry key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}
