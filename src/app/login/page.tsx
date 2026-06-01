import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import {
  isMandevAuthConfigured,
  MANDEV_SESSION_COOKIE,
  verifyMandevSessionToken,
} from "@/lib/mandev-session";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

function sanitizeRedirect(raw: string | undefined): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function LoginPage({ searchParams }: Props) {
  if (!isMandevAuthConfigured()) {
    redirect("/");
  }

  const sp = await searchParams;
  const redirectTo = sanitizeRedirect(sp.redirect);

  const jar = await cookies();
  const existing = jar.get(MANDEV_SESSION_COOKIE)?.value;
  if (existing && (await verifyMandevSessionToken(existing))) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <p className="font-heading text-lg font-semibold tracking-tight">
          ManDev
        </p>
        <p className="text-sm text-muted-foreground">
          Manta Development Tools
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
