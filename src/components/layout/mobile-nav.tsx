"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

import { mainNav } from "@/config/nav";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Top-level Features nav is hidden; routes remain reachable from backlog/project detail. */
const mobileNav = mainNav.filter((item) => item.href !== "/features");

type MobileNavProps = {
  authEnabled?: boolean;
};

export function MobileNav({ authEnabled = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "md:hidden",
        )}
      >
        <Menu className="size-4" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="font-heading text-base">ManDev</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-3">
          {mobileNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {authEnabled ? (
          <div className="border-t border-border p-3">
            <Link
              href="/logout"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-center",
              )}
            >
              Sign out
            </Link>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
