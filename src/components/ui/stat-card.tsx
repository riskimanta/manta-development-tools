import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  children?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  className,
  children,
}: StatCardProps) {
  return (
    <Card className={cn("surface-card", className)}>
      <CardHeader className="gap-1 pb-0">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      {hint || children ? (
        <CardContent className="pt-2 text-xs text-muted-foreground">
          {hint}
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}
