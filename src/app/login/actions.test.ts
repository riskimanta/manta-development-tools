import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MANDEV_SESSION_COOKIE } from "@/lib/mandev-session";

import { login } from "./actions";

const ENV_KEYS = ["MANDEV_PASSWORD", "MANDEV_AUTH_SECRET"] as const;

const VALID_SECRET = "test-secret-at-least-16-chars";
const VALID_PASSWORD = "dev-password";

const mockSetCookie = vi.fn();
const mockCookies = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { redirect } from "next/navigation";

let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function setAuthEnv(password?: string, secret?: string): void {
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

function loginForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }

  vi.clearAllMocks();
  mockCookies.mockResolvedValue({ set: mockSetCookie });
  vi.mocked(redirect).mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
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

describe("login", () => {
  it("redirects to / when auth is not configured", async () => {
    setAuthEnv(undefined, VALID_SECRET);

    await expect(login(undefined, loginForm())).rejects.toThrow("REDIRECT:/");

    expect(redirect).toHaveBeenCalledWith("/");
    expect(mockCookies).not.toHaveBeenCalled();
  });

  it("returns misconfiguration error when MANDEV_AUTH_SECRET is missing", async () => {
    setAuthEnv(VALID_PASSWORD, undefined);

    const result = await login(undefined, loginForm({ password: VALID_PASSWORD }));

    expect(result).toEqual({
      error:
        "Server misconfiguration: set MANDEV_AUTH_SECRET (min 16 characters).",
    });
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns misconfiguration error when MANDEV_AUTH_SECRET is too short", async () => {
    setAuthEnv(VALID_PASSWORD, "short-secret");

    const result = await login(undefined, loginForm({ password: VALID_PASSWORD }));

    expect(result).toEqual({
      error:
        "Server misconfiguration: set MANDEV_AUTH_SECRET (min 16 characters).",
    });
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when password input is missing", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const result = await login(undefined, loginForm());

    expect(result).toEqual({ error: "Invalid password." });
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when password is wrong", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const result = await login(
      undefined,
      loginForm({ password: "wrong-password" }),
    );

    expect(result).toEqual({ error: "Invalid password." });
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sets session cookie and redirects on successful login", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    await expect(
      login(undefined, loginForm({ password: VALID_PASSWORD })),
    ).rejects.toThrow("REDIRECT:/");

    expect(mockCookies).toHaveBeenCalled();
    expect(mockSetCookie).toHaveBeenCalledOnce();
    const [name, token, options] = mockSetCookie.mock.calls[0]!;
    expect(name).toBe(MANDEV_SESSION_COOKIE);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to sanitized redirect target after successful login", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    await expect(
      login(
        undefined,
        loginForm({ password: VALID_PASSWORD, redirect: "/projects" }),
      ),
    ).rejects.toThrow("REDIRECT:/projects");

    expect(redirect).toHaveBeenCalledWith("/projects");
  });

  it("falls back to / for unsafe redirect targets", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const unsafeTargets = ["//evil.com", "https://evil.com", "evil.com"];

    for (const target of unsafeTargets) {
      vi.clearAllMocks();
      mockCookies.mockResolvedValue({ set: mockSetCookie });
      vi.mocked(redirect).mockImplementation((url: string) => {
        throw new Error(`REDIRECT:${url}`);
      });

      await expect(
        login(
          undefined,
          loginForm({ password: VALID_PASSWORD, redirect: target }),
        ),
      ).rejects.toThrow("REDIRECT:/");

      expect(redirect).toHaveBeenCalledWith("/");
    }
  });
});
