import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getMandevAgentToken,
  verifyMandevAgentAuthorization,
} from "@/lib/mandev-agent-auth";

const ENV_KEY = "MANDEV_AGENT_TOKEN";

let savedToken: string | undefined;

beforeEach(() => {
  savedToken = process.env[ENV_KEY];
});

afterEach(() => {
  if (savedToken === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = savedToken;
  }
});

describe("getMandevAgentToken", () => {
  it("returns trimmed token when configured", () => {
    process.env[ENV_KEY] = "  dev-token  ";
    expect(getMandevAgentToken()).toBe("dev-token");
  });

  it("returns null when token is missing", () => {
    delete process.env[ENV_KEY];
    expect(getMandevAgentToken()).toBeNull();
  });
});

describe("verifyMandevAgentAuthorization", () => {
  it("rejects when token is not configured", () => {
    delete process.env[ENV_KEY];

    expect(verifyMandevAgentAuthorization("Bearer dev-token")).toEqual({
      ok: false,
      code: "AGENT_TOKEN_NOT_CONFIGURED",
    });
  });

  it("rejects missing authorization header", () => {
    process.env[ENV_KEY] = "dev-token";

    expect(verifyMandevAgentAuthorization(null)).toEqual({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects invalid bearer token", () => {
    process.env[ENV_KEY] = "dev-token";

    expect(verifyMandevAgentAuthorization("Bearer wrong-token")).toEqual({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("accepts matching bearer token", () => {
    process.env[ENV_KEY] = "dev-token";

    expect(verifyMandevAgentAuthorization("Bearer dev-token")).toEqual({
      ok: true,
    });
  });
});
