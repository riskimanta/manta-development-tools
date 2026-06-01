"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type ErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorView({ error, reset }: ErrorViewProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const showDevDetail = process.env.NODE_ENV === "development" && error.message;

  return (
    <EmptyState
      title="Something went wrong"
      description="ManDev hit an unexpected error."
      className="mt-4"
    >
      {showDevDetail ? (
        <pre className="max-w-md overflow-x-auto rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
          {error.message}
        </pre>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Dashboard
        </Link>
      </div>
    </EmptyState>
  );
}
