import { type NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/services/work-progress", () => ({
  captureWorkProgressForCwd: vi.fn(),
  WorkProgressServiceError: class WorkProgressServiceError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "WorkProgressServiceError";
      this.code = code;
    }
  },
}));

import {
  captureWorkProgressForCwd,
  WorkProgressServiceError,
} from "@/services/work-progress";

const ENV_KEY = "MANDEV_AGENT_TOKEN";
let savedToken: string | undefined;

function mockRequest(
  options: {
    authorization?: string;
    body?: unknown;
  } = {},
): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "authorization"
          ? (options.authorization ?? null)
          : null,
    },
    json: async () => options.body,
  } as unknown as NextRequest;
}

beforeEach(() => {
  savedToken = process.env[ENV_KEY];
  process.env[ENV_KEY] = "dev-token";
  vi.clearAllMocks();
});

afterEach(() => {
  if (savedToken === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = savedToken;
  }
});

describe("POST /api/work-progress/capture", () => {
  it("returns 503 when agent token is not configured", async () => {
    delete process.env[ENV_KEY];

    const response = await POST(
      mockRequest({
        authorization: "Bearer dev-token",
        body: { cwd: "/Users/dev/mandev" },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "AGENT_TOKEN_NOT_CONFIGURED",
    });
  });

  it("returns 401 when authorization header is missing", async () => {
    const response = await POST(
      mockRequest({
        body: { cwd: "/Users/dev/mandev" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("returns 401 when authorization token is invalid", async () => {
    const response = await POST(
      mockRequest({
        authorization: "Bearer wrong-token",
        body: { cwd: "/Users/dev/mandev" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("returns success payload from the service", async () => {
    vi.mocked(captureWorkProgressForCwd).mockResolvedValue({
      project: {
        id: "proj-1",
        name: "ManDev",
        slug: "mandev",
        localPath: "/Users/dev/mandev",
      },
      snapshot: {
        id: "wp-1",
        projectId: "proj-1",
        branch: "main",
        latestCommitHash: "abc1234",
        latestCommitMessage: "feat: add cli",
        latestCommitAuthor: "Dev",
        latestCommitDate: "2026-06-08T04:00:00.000Z",
        changedFiles: [],
        changedFilesCount: 0,
        gitStatusText: "",
        summary: "main @ abc1234: feat: add cli (clean working tree)",
        note: null,
        createdAt: "2026-06-08T04:00:00.000Z",
        updatedAt: "2026-06-08T04:00:00.000Z",
      },
    });

    const response = await POST(
      mockRequest({
        authorization: "Bearer dev-token",
        body: {
          cwd: "/Users/dev/mandev",
          note: "CLI capture",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      project: {
        id: "proj-1",
        name: "ManDev",
        slug: "mandev",
        localPath: "/Users/dev/mandev",
      },
      snapshot: {
        id: "wp-1",
        branch: "main",
        latestCommitHash: "abc1234",
        latestCommitMessage: "feat: add cli",
        changedFilesCount: 0,
        createdAt: "2026-06-08T04:00:00.000Z",
      },
    });
  });

  it("maps service errors to agent error codes", async () => {
    vi.mocked(captureWorkProgressForCwd).mockRejectedValue(
      new WorkProgressServiceError(
        "PROJECT_NOT_FOUND",
        "No registered ManDev project matches the current working directory.",
      ),
    );

    const response = await POST(
      mockRequest({
        authorization: "Bearer dev-token",
        body: { cwd: "/tmp/unregistered" },
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "PROJECT_NOT_FOUND",
    });
  });
});
