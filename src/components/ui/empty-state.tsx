import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn("surface-card border-dashed bg-muted/10", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center sm:py-14">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
