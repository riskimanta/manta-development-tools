import { type NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { MANDEV_SESSION_COOKIE } from "@/lib/mandev-session";

import { GET } from "./route";

function mockRequest(url = "http://localhost:3000/logout"): NextRequest {
  return { url } as NextRequest;
}

describe("GET /logout", () => {
  it("redirects to /login", async () => {
    const res = await GET(mockRequest());

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    expect(new URL(location!).pathname).toBe("/login");
    expect(new URL(location!).origin).toBe("http://localhost:3000");
  });

  it("preserves request origin in redirect URL", async () => {
    const res = await GET(mockRequest("https://mandev.example/logout"));

    const location = res.headers.get("location");
    expect(new URL(location!).href).toBe("https://mandev.example/login");
  });

  it("clears the ManDev session cookie with expected options", async () => {
    const res = await GET(mockRequest());

    const cookie = res.cookies.get(MANDEV_SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie!.name).toBe(MANDEV_SESSION_COOKIE);
    expect(cookie!.value).toBe("");
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    expect(cookie!.secure).toBe(process.env.NODE_ENV === "production");
  });
});
