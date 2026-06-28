import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    variant?: "default" | "outline" | "ghost";
  };
  actions?: ReactNode;
  className?: string;
  id?: string;
};

export function SectionHeader({
  title,
  description,
  action,
  actions,
  className,
  id,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className={cn("flex flex-wrap items-end justify-between gap-3", className)}
    >
      <div className="space-y-0.5">
        <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : action ? (
        <Link
          href={action.href}
          className={cn(
            buttonVariants({
              variant: action.variant ?? "ghost",
              size: "sm",
            }),
            "text-muted-foreground",
          )}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
