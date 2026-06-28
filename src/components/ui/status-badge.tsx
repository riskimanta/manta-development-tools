import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeVariant =
  | "clean"
  | "dirty"
  | "draft"
  | "done"
  | "ready"
  | "in_progress"
  | "neutral"
  | "warning"
  | "danger";

const variantClassName: Record<StatusBadgeVariant, string> = {
  clean:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  dirty:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  draft: "border-border bg-muted/50 text-muted-foreground",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ready: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  in_progress:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  neutral: "border-border bg-muted/40 text-muted-foreground",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger:
    "border-destructive/30 bg-destructive/10 text-destructive",
};

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  children: ReactNode;
  className?: string;
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium uppercase tracking-wide",
        variantClassName[variant],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function featureStatusBadgeVariant(
  status: string,
): StatusBadgeVariant {
  switch (status) {
    case "done":
      return "done";
    case "ready":
      return "ready";
    case "in_progress":
      return "in_progress";
    case "draft":
    default:
      return "draft";
  }
}

export function workProgressCleanDirtyVariant(
  isClean: boolean,
): StatusBadgeVariant {
  return isClean ? "clean" : "dirty";
}
