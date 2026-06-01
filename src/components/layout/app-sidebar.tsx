"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "mandev-sidebar-collapsed";

type AppSidebarProps = {
  className?: string;
  authEnabled?: boolean;
};

export function AppSidebar({ className, authEnabled = false }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
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
        "flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        mounted && collapsed ? "w-[4.25rem]" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex leading-tight transition-opacity hover:opacity-90",
            collapsed ? "items-center justify-center" : "flex-col",
          )}
          title="ManDev home"
        >
          {collapsed ? (
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
          "flex flex-1 flex-col gap-0.5 p-3",
          collapsed && "items-center px-1.5",
        )}
      >
        {mainNav.map((item) => {
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
                collapsed ? "w-full justify-center px-0" : "px-2.5",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "mt-auto flex flex-col gap-2 border-t border-sidebar-border p-2",
          collapsed && "items-center px-1",
        )}
      >
        {authEnabled ? (
          <Link
            href="/logout"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start gap-2 text-muted-foreground hover:text-foreground",
              collapsed && "size-9 justify-center px-0",
            )}
            title="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed ? <span className="text-xs">Sign out</span> : null}
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            "justify-start gap-2 text-muted-foreground hover:text-foreground",
            collapsed && "size-9 justify-center px-0",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0" />
          ) : (
            <ChevronLeft className="size-4 shrink-0" />
          )}
          {!collapsed ? (
            <span className="text-xs">Collapse</span>
          ) : null}
        </Button>
        {!collapsed ? (
          <p className="px-1 pb-1 text-[11px] leading-snug text-muted-foreground">
            Local control plane for projects, features, and future integrations.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
