import { describe, expect, it } from "vitest";

import { buildWorkProgressAiSummaryPrompt } from "@/lib/work-progress-ai-summary-prompt";
import type { WorkProgressSession } from "@/lib/work-progress-session";
import type { WorkProgressRecord } from "@/services/work-progress";

function makeSnapshot(
  overrides: Partial<WorkProgressRecord> & Pick<WorkProgressRecord, "id" | "createdAt">,
): WorkProgressRecord {
  return {
    projectId: "proj-1",
    branch: "main",
    latestCommitHash: "abc1234",
    latestCommitMessage: "feat: example",
    latestCommitAuthor: "Dev",
    latestCommitDate: overrides.createdAt,
    changedFiles: [],
    changedFilesCount: 0,
    gitStatusText: "",
    summary: "main @ abc1234: feat: example (clean working tree)",
    note: null,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<WorkProgressSession> = {},
): WorkProgressSession {
  const snapshots = overrides.snapshots ?? [
    makeSnapshot({
      id: "wp-1",
      createdAt: "2026-06-08T10:00:00.000Z",
    }),
    makeSnapshot({
      id: "wp-2",
      createdAt: "2026-06-08T10:30:00.000Z",
      latestCommitHash: "def5678",
      latestCommitMessage: "feat: follow-up",
      changedFiles: [{ status: "M", path: "src/app/page.tsx" }],
      changedFilesCount: 1,
    }),
  ];

  return {
    id: "session-wp-1-wp-2",
    projectId: "proj-1",
    branch: "main",
    startedAt: snapshots[0]!.createdAt,
    endedAt: snapshots[snapshots.length - 1]!.createdAt,
    durationMs: 30 * 60 * 1000,
    snapshotCount: snapshots.length,
    firstSnapshotId: snapshots[0]!.id,
    latestSnapshotId: snapshots[snapshots.length - 1]!.id,
    firstCommitHash: snapshots[0]!.latestCommitHash,
    latestCommitHash: snapshots[snapshots.length - 1]!.latestCommitHash,
    latestCommitMessage: snapshots[snapshots.length - 1]!.latestCommitMessage,
    changedFilesCount: 1,
    changedFiles: [{ status: "M", path: "src/app/page.tsx" }],
    latestStatusLabel: "Dirty working tree",
    isClean: false,
    snapshots,
    ...overrides,
  };
}

describe("buildWorkProgressAiSummaryPrompt", () => {
  const baseInput = {
    project: {
      name: "ManDev",
      localPath: "/Users/dev/manta-development-tools",
    },
    session: makeSession(),
  };

  it("includes project name", () => {
    const prompt = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(prompt).toContain("- Name: ManDev");
  });

  it("includes branch", () => {
    const prompt = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(prompt).toContain("- Branch: main");
  });

  it("includes commit metadata", () => {
    const prompt = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(prompt).toContain("- First commit: abc1234");
    expect(prompt).toContain("- Latest commit: def5678");
    expect(prompt).toContain("- Latest commit message: feat: follow-up");
  });

  it("includes changed files", () => {
    const prompt = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(prompt).toContain("Changed files:");
    expect(prompt).toContain("- M src/app/page.tsx");
  });

  it("includes snapshot timeline", () => {
    const prompt = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(prompt).toContain("Snapshot timeline:");
    expect(prompt).toContain("1.");
    expect(prompt).toContain("2.");
    expect(prompt).toContain("abc1234");
    expect(prompt).toContain("def5678");
  });

  it("handles empty changed files", () => {
    const prompt = buildWorkProgressAiSummaryPrompt({
      ...baseInput,
      session: makeSession({
        changedFiles: [],
        changedFilesCount: 0,
        latestStatusLabel: "Clean working tree",
        isClean: true,
        snapshots: [
          makeSnapshot({
            id: "wp-1",
            createdAt: "2026-06-08T10:00:00.000Z",
          }),
        ],
        snapshotCount: 1,
        firstCommitHash: "abc1234",
        latestCommitHash: "abc1234",
        latestCommitMessage: "feat: example",
      }),
    });

    expect(prompt).toContain("(none — clean working tree)");
  });

  it("handles null/missing commit fields safely", () => {
    const prompt = buildWorkProgressAiSummaryPrompt({
      project: {
        name: "ManDev",
        localPath: null,
      },
      session: makeSession({
        branch: null,
        firstCommitHash: null,
        latestCommitHash: null,
        latestCommitMessage: null,
        snapshots: [
          makeSnapshot({
            id: "wp-1",
            createdAt: "2026-06-08T10:00:00.000Z",
            branch: "",
            latestCommitHash: "",
            latestCommitMessage: "",
          }),
        ],
        snapshotCount: 1,
        firstSnapshotId: "wp-1",
        latestSnapshotId: "wp-1",
      }),
    });

    expect(prompt).toContain("- Local path: Not provided");
    expect(prompt).toContain("- Branch: Unknown");
    expect(prompt).toContain("- First commit: Not available");
    expect(prompt).toContain("- Latest commit: Not available");
    expect(prompt).toContain("- Latest commit message: No commit message");
  });

  it("is deterministic for the same input", () => {
    const first = buildWorkProgressAiSummaryPrompt(baseInput);
    const second = buildWorkProgressAiSummaryPrompt(baseInput);

    expect(first).toBe(second);
  });
});
