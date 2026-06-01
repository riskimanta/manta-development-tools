import { type NextRequest, NextResponse } from "next/server";

import { MANDEV_SESSION_COOKIE } from "@/lib/mandev-session";

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.set(MANDEV_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
