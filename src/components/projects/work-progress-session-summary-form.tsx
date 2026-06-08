"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveWorkProgressSessionSummaryAction } from "@/app/projects/work-progress/session-summaries/actions";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { WorkProgressSessionSummaryActionState } from "@/lib/work-progress-session-summary-action-types";
import {
  WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";
import type { WorkProgressSessionSummaryRecord } from "@/services/work-progress-session-summaries";

type Props = {
  projectId: string;
  sessionId: string;
  summary: WorkProgressSessionSummaryRecord | null;
};

const initialState: WorkProgressSessionSummaryActionState | undefined =
  undefined;

export function WorkProgressSessionSummaryForm({
  projectId,
  sessionId,
  summary,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveWorkProgressSessionSummaryAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.message) {
      toast.success(state.message);
    } else if (state?.message && !state.ok) {
      toast.error(state.message);
    } else if (state?.fieldErrors?.summaryMarkdown?.[0]) {
      toast.error(state.fieldErrors.summaryMarkdown[0]);
    }
  }, [state?.ok, state?.message, state?.fieldErrors]);

  const summaryError = state?.fieldErrors?.summaryMarkdown?.[0];

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">AI Summary</h2>
      <p className="text-sm text-muted-foreground">
        Paste the AI-generated summary here after using Copy AI summary prompt.
        ManDev does not call an AI API.
      </p>

      {summary ? (
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Saved summary
          </p>
          <p className="whitespace-pre-wrap text-foreground/90">
            {summary.summaryMarkdown}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Updated {formatWorkProgressTimestamp(summary.updatedAt)} ·{" "}
            {formatRelativeTime(new Date(summary.updatedAt))}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL}
        </p>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sessionId" value={sessionId} />
        <div className="space-y-2">
          <label
            htmlFor="summaryMarkdown"
            className="text-sm font-medium text-foreground/80"
          >
            Summary text
          </label>
          <textarea
            id="summaryMarkdown"
            name="summaryMarkdown"
            rows={10}
            defaultValue={summary?.summaryMarkdown ?? ""}
            className="flex min-h-[10rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Paste your AI-generated summary here…"
            disabled={pending}
          />
          {summaryError ? (
            <p className="text-xs text-destructive">{summaryError}</p>
          ) : null}
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save summary"}
        </Button>
      </form>
    </section>
  );
}
