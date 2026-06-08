import {
  WORK_PROGRESS_USAGE_GUIDE_STEPS,
  WORK_PROGRESS_USAGE_GUIDE_TITLE,
} from "@/lib/work-progress-session-ui";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function WorkProgressUsageGuide({ className }: Props) {
  return (
    <section
      className={cn(
        "rounded-md border border-border/40 bg-muted/10 p-3 text-sm",
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {WORK_PROGRESS_USAGE_GUIDE_TITLE}
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
        {WORK_PROGRESS_USAGE_GUIDE_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
