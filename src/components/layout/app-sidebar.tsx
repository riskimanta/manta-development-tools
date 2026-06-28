"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "mandev-sidebar-collapsed";

/** Top-level Features nav is hidden from sidebar; routes remain reachable from backlog/project detail. */
const sidebarNav = mainNav.filter((item) => item.href !== "/features");

type AppSidebarProps = {
  className?: string;
  authEnabled?: boolean;
};

function readCollapsedFromStorage(): boolean {
  try {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    return saved === "1" || saved === "true";
  } catch {
    return false;
  }
}

export function AppSidebar({ className, authEnabled = false }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedFromStorage());
    setMounted(true);
  }, []);

  const effectiveCollapsed = mounted ? collapsed : false;

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-svh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        mounted && "transition-[width] duration-200 ease-out",
        effectiveCollapsed ? "w-[4.25rem]" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          effectiveCollapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex leading-tight transition-opacity hover:opacity-90",
            effectiveCollapsed ? "items-center justify-center" : "flex-col",
          )}
          title="ManDev home"
        >
          {effectiveCollapsed ? (
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent font-heading text-sm font-bold tracking-tight">
              M
            </span>
          ) : (
            <>
              <span className="font-heading text-sm font-semibold tracking-tight">
                ManDev
              </span>
              <span className="text-[11px] text-muted-foreground">
                Manta Development Tools
              </span>
            </>
          )}
        </Link>
      </div>
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3",
          effectiveCollapsed && "items-center px-1.5",
        )}
      >
        {sidebarNav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                effectiveCollapsed ? "w-full justify-center px-0" : "px-2.5",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {!effectiveCollapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "mt-auto flex flex-col gap-2 border-t border-sidebar-border p-2",
          effectiveCollapsed && "items-center px-1",
        )}
      >
        {authEnabled ? (
          <Link
            href="/logout"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start gap-2 text-muted-foreground hover:text-foreground",
              effectiveCollapsed && "size-9 justify-center px-0",
            )}
            title="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {!effectiveCollapsed ? <span className="text-xs">Sign out</span> : null}
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            "justify-start gap-2 text-muted-foreground hover:text-foreground",
            effectiveCollapsed && "size-9 justify-center px-0",
          )}
          title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {effectiveCollapsed ? (
            <ChevronRight className="size-4 shrink-0" />
          ) : (
            <ChevronLeft className="size-4 shrink-0" />
          )}
          {!effectiveCollapsed ? (
            <span className="text-xs">Collapse</span>
          ) : null}
        </Button>
        {!effectiveCollapsed ? (
          <p className="px-1 pb-1 text-[11px] leading-snug text-muted-foreground">
            Local control plane for projects, features, and future integrations.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
