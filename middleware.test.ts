import { type NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MANDEV_SESSION_COOKIE,
  signMandevSession,
} from "@/lib/mandev-session";

import { config, middleware } from "./middleware";

const ENV_KEYS = ["MANDEV_PASSWORD", "MANDEV_AUTH_SECRET"] as const;

const VALID_SECRET = "test-secret-at-least-16-chars";
const VALID_PASSWORD = "dev-password";

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

function createNextUrl(pathname: string): URL {
  const url = new URL(`http://localhost:3000${pathname}`);
  return Object.assign(url, {
    clone: () => createNextUrl(`${url.pathname}${url.search}`),
  });
}

function mockRequest(pathname: string, sessionToken?: string): NextRequest {
  return {
    nextUrl: createNextUrl(pathname),
    cookies: {
      get: (name: string) => {
        if (name === MANDEV_SESSION_COOKIE && sessionToken) {
          return { name, value: sessionToken };
        }
        return undefined;
      },
    },
  } as unknown as NextRequest;
}

/** Mirrors Next.js matcher: middleware runs only when pathname matches. */
function pathnameMatchesMiddleware(pathname: string): boolean {
  const pattern = config.matcher[0]!;
  return new RegExp(`^${pattern}$`).test(pathname);
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

describe("middleware config matcher", () => {
  it("excludes static and asset paths from middleware invocation", () => {
    const excluded = [
      "/_next/static/chunks/main.js",
      "/_next/image",
      "/favicon.ico",
      "/logo.png",
      "/hero.jpg",
      "/icon.svg",
      "/badge.webp",
      "/photo.gif",
    ];

    for (const pathname of excluded) {
      expect(pathnameMatchesMiddleware(pathname)).toBe(false);
    }
  });

  it("includes app routes in middleware invocation", () => {
    const included = ["/", "/projects", "/features", "/login", "/logout"];

    for (const pathname of included) {
      expect(pathnameMatchesMiddleware(pathname)).toBe(true);
    }
  });
});

describe("middleware auth routing", () => {
  it("allows protected routes when auth is disabled", async () => {
    setAuthEnv(undefined, VALID_SECRET);

    const res = await middleware(mockRequest("/projects"));

    expect(res.status).toBe(200);
  });

  it("allows public routes when auth is enabled", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    for (const pathname of ["/login", "/logout"]) {
      const res = await middleware(mockRequest(pathname));
      expect(res.status).toBe(200);
    }
  });

  it("returns 503 when auth is enabled but MANDEV_AUTH_SECRET is invalid", async () => {
    setAuthEnv(VALID_PASSWORD, "short");

    const res = await middleware(mockRequest("/projects"));

    expect(res.status).toBe(503);
    expect(await res.text()).toBe(
      "ManDev: set MANDEV_AUTH_SECRET to at least 16 characters when MANDEV_PASSWORD is set.",
    );
  });

  it("redirects to /login with original path when session cookie is missing", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const res = await middleware(mockRequest("/projects"));

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("redirect")).toBe("/projects");
  });

  it("allows protected routes when session cookie is valid", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);
    const token = await signMandevSession();

    const res = await middleware(mockRequest("/projects", token));

    expect(res.status).toBe(200);
  });

  it("redirects to /login without redirect param when session cookie is invalid", async () => {
    setAuthEnv(VALID_PASSWORD, VALID_SECRET);

    const res = await middleware(mockRequest("/projects", "not-a-valid-jwt"));

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.has("redirect")).toBe(false);
  });
});
