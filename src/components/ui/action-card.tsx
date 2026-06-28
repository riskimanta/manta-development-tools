import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  meta?: ReactNode;
  footer?: ReactNode;
  className?: string;
  id?: string;
};

export function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  actionLabel = "Open",
  meta,
  footer,
  className,
  id,
}: ActionCardProps) {
  return (
    <Card id={id} className={cn("surface-card flex h-full flex-col", className)}>
      <CardHeader className="gap-3 pb-0">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-3 pt-4">
        {meta ? <div className="text-sm">{meta}</div> : null}
        {footer}
        {href ? (
          href.startsWith("#") ? (
            <a
              href={href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-auto w-full justify-center",
              )}
            >
              {actionLabel}
            </a>
          ) : (
            <Link
              href={href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-auto w-full justify-center",
              )}
            >
              {actionLabel}
            </Link>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
