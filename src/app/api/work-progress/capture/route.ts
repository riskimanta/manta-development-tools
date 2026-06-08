import { type NextRequest, NextResponse } from "next/server";

import { verifyMandevAgentAuthorization } from "@/lib/mandev-agent-auth";
import type { WorkProgressAgentErrorCode } from "@/lib/work-progress-agent-types";
import { workProgressCaptureRequestSchema } from "@/lib/validations/work-progress-capture";
import {
  captureWorkProgressForCwd,
  WorkProgressServiceError,
} from "@/services/work-progress";

function agentError(
  code: WorkProgressAgentErrorCode,
  error: string,
  status: number,
) {
  return NextResponse.json({ ok: false, error, code }, { status });
}

function mapServiceError(error: WorkProgressServiceError): {
  code: WorkProgressAgentErrorCode;
  status: number;
} {
  switch (error.code) {
    case "PROJECT_NOT_FOUND":
      return { code: "PROJECT_NOT_FOUND", status: 404 };
    case "LOCAL_PATH_MISSING":
      return { code: "LOCAL_PATH_MISSING", status: 400 };
    case "PATH_UNSAFE":
      return { code: "LOCAL_PATH_NOT_FOUND", status: 400 };
    case "NOT_GIT_REPOSITORY":
      return { code: "NOT_GIT_REPOSITORY", status: 400 };
    case "GIT_COMMAND_FAILED":
      return { code: "CAPTURE_FAILED", status: 500 };
    default:
      return { code: "CAPTURE_FAILED", status: 500 };
  }
}

export async function POST(request: NextRequest) {
  const auth = verifyMandevAgentAuthorization(
    request.headers.get("authorization"),
  );
  if (!auth.ok) {
    const status = auth.code === "AGENT_TOKEN_NOT_CONFIGURED" ? 503 : 401;
    const message =
      auth.code === "AGENT_TOKEN_NOT_CONFIGURED"
        ? "MANDEV_AGENT_TOKEN is not configured on the ManDev server."
        : "Invalid or missing agent authorization token.";

    return agentError(auth.code, message, status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return agentError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400,
    );
  }

  const parsed = workProgressCaptureRequestSchema.safeParse(body);
  if (!parsed.success) {
    return agentError(
      "INVALID_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid request body.",
      400,
    );
  }

  try {
    const result = await captureWorkProgressForCwd({
      cwd: parsed.data.cwd,
      note: parsed.data.note ?? null,
      dedupe: parsed.data.dedupe ?? false,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      skipped: result.skipped,
      ...(result.reason ? { reason: result.reason } : {}),
      project: result.project,
      snapshot: {
        id: result.snapshot.id,
        branch: result.snapshot.branch,
        latestCommitHash: result.snapshot.latestCommitHash,
        latestCommitMessage: result.snapshot.latestCommitMessage,
        changedFilesCount: result.snapshot.changedFilesCount,
        createdAt: result.snapshot.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof WorkProgressServiceError) {
      const mapped = mapServiceError(error);
      return agentError(mapped.code, error.message, mapped.status);
    }

    throw error;
  }
}
