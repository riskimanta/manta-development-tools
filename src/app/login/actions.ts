"use server";

import { timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  isMandevAuthConfigured,
  isMandevAuthSecretValid,
  MANDEV_SESSION_COOKIE,
  signMandevSession,
} from "@/lib/mandev-session";

export type LoginState = { error?: string };

function safePasswordEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function login(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  if (!isMandevAuthConfigured()) {
    redirect("/");
  }
  if (!isMandevAuthSecretValid()) {
    return {
      error:
        "Server misconfiguration: set MANDEV_AUTH_SECRET (min 16 characters).",
    };
  }

  const password = String(formData.get("password") ?? "");
  const expected = process.env.MANDEV_PASSWORD ?? "";
  if (!safePasswordEqual(password, expected)) {
    return { error: "Invalid password." };
  }

  const token = await signMandevSession();
  const jar = await cookies();
  jar.set(MANDEV_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const dest = sanitizeRedirect(formData.get("redirect"));
  redirect(dest);
}
