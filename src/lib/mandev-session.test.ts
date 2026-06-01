import { decodeJwt } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  isMandevAuthConfigured,
  isMandevAuthSecretValid,
  signMandevSession,
  verifyMandevSessionToken,
} from "@/lib/mandev-session";

const ENV_KEYS = ["MANDEV_PASSWORD", "MANDEV_AUTH_SECRET"] as const;

const VALID_SECRET = "test-secret-at-least-16-chars";
const VALID_PASSWORD = "dev-password";

let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function setAuthEnv(
  password?: string,
  secret?: string,
): void {
  if (password === undefined) {
    delete process.env.MANDEV_PASSWORD;
  } else {
    process.env.MANDEV_PASSWORD = password;
  }
  if (secret === undefined) {
    delete process.env.MANDEV_AUTH_SECRET;
  } else {
    process.env.MANDEV_AUTH_SECRET = secret;
  }
}

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe("isMandevAuthConfigured", () => {
  it("returns false when MANDEV_PASSWORD is unset", () => {
    setAuthEnv(undefined, VALID_SECRET);
    expect(isMandevAuthConfigured()).toBe(false);
  });

  it("returns false when MANDEV_PASSWORD is empty", () => {
    setAuthEnv("", VALID_SECRET);
    expect(isMandevAuthConfigured()).toBe(false);
  });

  it("returns true when MANDEV_PASSWORD is a non-empty string", () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    expect(isMandevAuthConfigured()).toBe(true);
  });
});

describe("isMandevAuthSecretValid", () => {
  it("returns false when MANDEV_AUTH_SECRET is unset", () => {
    setAuthEnv(VALID_PASSWORD, undefined);
    expect(isMandevAuthSecretValid()).toBe(false);
  });

  it("returns false when MANDEV_AUTH_SECRET is shorter than 16 characters", () => {
    setAuthEnv(VALID_PASSWORD, "short-secret");
    expect(isMandevAuthSecretValid()).toBe(false);
  });

  it("returns true when MANDEV_AUTH_SECRET is at least 16 characters", () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    expect(isMandevAuthSecretValid()).toBe(true);
  });
});

describe("signMandevSession", () => {
  it("throws when MANDEV_AUTH_SECRET is missing or too short", async () => {
    setAuthEnv(VALID_PASSWORD, "too-short");

    await expect(signMandevSession()).rejects.toThrow(
      "MANDEV_AUTH_SECRET must be at least 16 characters when MANDEV_PASSWORD is set",
    );
  });

  it("signs a JWT with expected subject and ~7 day expiry", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const token = await signMandevSession();
    const payload = decodeJwt(token);

    expect(payload.sub).toBe("mandev");
    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp! - payload.iat!).toBe(60 * 60 * 24 * 7);
  });
});

describe("verifyMandevSessionToken", () => {
  it("returns false when MANDEV_AUTH_SECRET is invalid", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    const token = await signMandevSession();

    setAuthEnv(VALID_PASSWORD, undefined);

    expect(await verifyMandevSessionToken(token)).toBe(false);
  });

  it("returns true for a token signed with the current secret", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    const token = await signMandevSession();

    expect(await verifyMandevSessionToken(token)).toBe(true);
  });

  it("returns false for malformed tokens", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    expect(await verifyMandevSessionToken("not-a-jwt")).toBe(false);
  });

  it("returns false for a token signed with a different secret", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    const token = await signMandevSession();

    process.env.MANDEV_AUTH_SECRET = "other-secret-at-least-16-chars";

    expect(await verifyMandevSessionToken(token)).toBe(false);
  });
});
