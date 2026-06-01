import { type NextRequest, NextResponse } from "next/server";

import {
  isMandevAuthConfigured,
  isMandevAuthSecretValid,
  MANDEV_SESSION_COOKIE,
  verifyMandevSessionToken,
} from "@/lib/mandev-session";

const PUBLIC_PATH_PREFIXES = ["/login", "/logout"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  if (!isMandevAuthConfigured()) {
    return NextResponse.next();
  }

  if (!isMandevAuthSecretValid()) {
    return new NextResponse(
      "ManDev: set MANDEV_AUTH_SECRET to at least 16 characters when MANDEV_PASSWORD is set.",
      { status: 503 },
    );
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(MANDEV_SESSION_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const ok = await verifyMandevSessionToken(token);
  if (!ok) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif)$).*)",
  ],
};
