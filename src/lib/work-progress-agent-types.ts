export type WorkProgressAgentErrorCode =
  | "AGENT_TOKEN_NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "PROJECT_NOT_FOUND"
  | "LOCAL_PATH_MISSING"
  | "LOCAL_PATH_NOT_FOUND"
  | "NOT_GIT_REPOSITORY"
  | "CAPTURE_FAILED";

export type WorkProgressAgentSuccessResponse = {
  ok: true;
  project: {
    id: string;
    name: string;
    slug: string;
    localPath: string;
  };
  snapshot: {
    id: string;
    branch: string | null;
    latestCommitHash: string | null;
    latestCommitMessage: string | null;
    changedFilesCount: number;
    createdAt: string;
  };
};

export type WorkProgressAgentErrorResponse = {
  ok: false;
  error: string;
  code: WorkProgressAgentErrorCode;
};

export type WorkProgressAgentResponse =
  | WorkProgressAgentSuccessResponse
  | WorkProgressAgentErrorResponse;
