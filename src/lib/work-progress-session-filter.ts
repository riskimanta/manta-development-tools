import type { WorkProgressSessionListItem } from "@/services/work-progress";

export type WorkProgressSessionStatusFilter = "all" | "clean" | "dirty";
export type WorkProgressSessionSummaryFilter = "all" | "has" | "none";

export type WorkProgressSessionFilters = {
  q?: string;
  branch?: string;
  status?: WorkProgressSessionStatusFilter;
  summary?: WorkProgressSessionSummaryFilter;
  from?: string;
  to?: string;
};

export type WorkProgressSessionSearchParams = {
  q?: string;
  branch?: string;
  status?: string;
  summary?: string;
  from?: string;
  to?: string;
};

export type WorkProgressSessionFilterResult = {
  filters: WorkProgressSessionFilters;
  branchOptions: string[];
  sessions: WorkProgressSessionListItem[];
  totalSessionCount: number;
  filteredCount: number;
};

const STATUS_FILTERS = new Set<WorkProgressSessionStatusFilter>([
  "all",
  "clean",
  "dirty",
]);
const SUMMARY_FILTERS = new Set<WorkProgressSessionSummaryFilter>([
  "all",
  "has",
  "none",
]);

function normalizeStatusFilter(
  value: string | undefined,
): WorkProgressSessionStatusFilter {
  if (!value) {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  return STATUS_FILTERS.has(normalized as WorkProgressSessionStatusFilter)
    ? (normalized as WorkProgressSessionStatusFilter)
    : "all";
}

function normalizeSummaryFilter(
  value: string | undefined,
): WorkProgressSessionSummaryFilter {
  if (!value) {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  return SUMMARY_FILTERS.has(normalized as WorkProgressSessionSummaryFilter)
    ? (normalized as WorkProgressSessionSummaryFilter)
    : "all";
}

function parseDateParam(value: string | undefined): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return undefined;
  }

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function sessionStartedAtInRange(
  startedAt: string,
  from?: Date,
  to?: Date,
): boolean {
  if (!from && !to) {
    return true;
  }

  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) {
    return true;
  }

  if (from && started < from) {
    return false;
  }

  if (to) {
    const toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    if (started >= toExclusive) {
      return false;
    }
  }

  return true;
}

function buildSessionSearchHaystack(
  session: WorkProgressSessionListItem,
): string {
  const parts = [
    session.branch,
    session.latestCommitHash,
    session.latestCommitMessage,
    session.firstCommitHash,
    ...session.changedFiles.map((file) => file.path),
    session.savedSummary?.summaryMarkdown,
    session.savedSummary?.preview,
    ...session.snapshots.map((snapshot) => snapshot.latestCommitMessage),
    ...session.snapshots.map((snapshot) => snapshot.latestCommitHash),
  ];

  return parts
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n")
    .toLowerCase();
}

export function parseWorkProgressSessionFilters(
  searchParams: WorkProgressSessionSearchParams = {},
): WorkProgressSessionFilters {
  const q = searchParams.q?.trim() || undefined;
  const branch = searchParams.branch?.trim() || undefined;
  const status = normalizeStatusFilter(searchParams.status);
  const summary = normalizeSummaryFilter(searchParams.summary);
  const fromDate = parseDateParam(searchParams.from);
  const toDate = parseDateParam(searchParams.to);

  return {
    q,
    branch,
    status,
    summary,
    from: fromDate
      ? searchParams.from?.trim()
      : undefined,
    to: toDate ? searchParams.to?.trim() : undefined,
  };
}

export function deriveWorkProgressSessionBranchOptions(
  sessions: WorkProgressSessionListItem[],
): string[] {
  const branches = new Set<string>();

  for (const session of sessions) {
    if (session.branch?.trim()) {
      branches.add(session.branch);
    }
  }

  return Array.from(branches).sort((left, right) => left.localeCompare(right));
}

export function filterWorkProgressSessions(
  sessions: WorkProgressSessionListItem[],
  filters: WorkProgressSessionFilters = {},
): WorkProgressSessionListItem[] {
  const query = filters.q?.trim().toLowerCase();
  const branch = filters.branch?.trim();
  const status = filters.status ?? "all";
  const summary = filters.summary ?? "all";
  const fromDate = parseDateParam(filters.from);
  const toDate = parseDateParam(filters.to);

  return sessions.filter((session) => {
    if (branch && session.branch !== branch) {
      return false;
    }

    if (status === "clean" && !session.isClean) {
      return false;
    }

    if (status === "dirty" && session.isClean) {
      return false;
    }

    if (summary === "has" && !session.savedSummary) {
      return false;
    }

    if (summary === "none" && session.savedSummary) {
      return false;
    }

    if (!sessionStartedAtInRange(session.startedAt, fromDate, toDate)) {
      return false;
    }

    if (query) {
      const haystack = buildSessionSearchHaystack(session);
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function resolveWorkProgressSessionFilters(
  sessions: WorkProgressSessionListItem[],
  searchParams: WorkProgressSessionSearchParams = {},
): WorkProgressSessionFilterResult {
  const filters = parseWorkProgressSessionFilters(searchParams);
  const filteredSessions = filterWorkProgressSessions(sessions, filters);

  return {
    filters,
    branchOptions: deriveWorkProgressSessionBranchOptions(sessions),
    sessions: filteredSessions,
    totalSessionCount: sessions.length,
    filteredCount: filteredSessions.length,
  };
}

export function buildWorkProgressSessionsListHref(
  projectId: string,
  filters: WorkProgressSessionFilters = {},
): string {
  const search = new URLSearchParams();

  if (filters.q) {
    search.set("q", filters.q);
  }
  if (filters.branch) {
    search.set("branch", filters.branch);
  }
  if (filters.status && filters.status !== "all") {
    search.set("status", filters.status);
  }
  if (filters.summary && filters.summary !== "all") {
    search.set("summary", filters.summary);
  }
  if (filters.from) {
    search.set("from", filters.from);
  }
  if (filters.to) {
    search.set("to", filters.to);
  }

  const query = search.toString();
  return query
    ? `/projects/${projectId}/work-progress?${query}`
    : `/projects/${projectId}/work-progress`;
}

export function formatWorkProgressSessionFilterCountLabel(
  filteredCount: number,
  totalSessionCount: number,
): string {
  return `Showing ${filteredCount} of ${totalSessionCount} session${totalSessionCount === 1 ? "" : "s"}`;
}
