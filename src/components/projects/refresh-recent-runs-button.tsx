"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function RefreshRecentRunsButton({ className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 gap-1 px-2 text-[11px] text-muted-foreground",
        className,
      )}
      disabled={isPending}
      onClick={handleRefresh}
      aria-label="Refresh recent runs"
    >
      <RefreshCw className={cn("size-3", isPending && "animate-spin")} />
      Refresh recent runs
    </Button>
  );
}
