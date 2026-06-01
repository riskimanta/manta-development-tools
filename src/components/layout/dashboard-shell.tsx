import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandMenu } from "@/components/layout/command-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type DashboardShellProps = {
  children: ReactNode;
  authEnabled?: boolean;
};

export function DashboardShell({
  children,
  authEnabled = false,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <AppSidebar authEnabled={authEnabled} className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:gap-3 lg:px-6">
          <MobileNav authEnabled={authEnabled} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CommandMenu />
          </div>
          {authEnabled ? (
            <a
              href="/logout"
              className="hidden text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:inline"
            >
              Sign out
            </a>
          ) : null}
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
