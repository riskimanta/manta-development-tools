import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LinkListCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function LinkListCard({
  href,
  icon: Icon,
  title,
  meta,
  trailing,
  className,
}: LinkListCardProps) {
  return (
    <Link href={href} className={className}>
      <Card className="surface-card-interactive">
        <CardContent className="flex items-center gap-3 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{meta}</p>
          </div>
          {trailing ?? (
            <ArrowRight className="size-4 shrink-0 text-muted-foreground/70" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function LinkList({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn("space-y-2", className)}>{children}</ul>;
}
