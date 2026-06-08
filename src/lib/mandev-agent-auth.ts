export type MandevAgentAuthErrorCode =
  | "AGENT_TOKEN_NOT_CONFIGURED"
  | "UNAUTHORIZED";

export type MandevAgentAuthResult =
  | { ok: true }
  | { ok: false; code: MandevAgentAuthErrorCode };

export function getMandevAgentToken(): string | null {
  const token = process.env.MANDEV_AGENT_TOKEN?.trim();
  return token || null;
}

export function verifyMandevAgentAuthorization(
  authorizationHeader: string | null,
): MandevAgentAuthResult {
  const configuredToken = getMandevAgentToken();
  if (!configuredToken) {
    return { ok: false, code: "AGENT_TOKEN_NOT_CONFIGURED" };
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const providedToken = authorizationHeader.slice("Bearer ".length).trim();
  if (!providedToken || providedToken !== configuredToken) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  return { ok: true };
}
