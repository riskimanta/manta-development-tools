import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export function NotFoundView() {
  return (
    <EmptyState
      title="Page not found"
      description="The page or record you're looking for does not exist."
      className="mt-4"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={buttonVariants()}>
          Dashboard
        </Link>
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Projects
        </Link>
        <Link
          href="/features"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Features
        </Link>
      </div>
    </EmptyState>
  );
}
