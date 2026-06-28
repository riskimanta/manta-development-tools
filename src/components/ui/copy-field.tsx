"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyFieldProps = {
  label: string;
  value: string;
  copyLabel?: string;
  successMessage?: string;
  className?: string;
  mono?: boolean;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyField({
  label,
  value,
  copyLabel = "Copy",
  successMessage = "Copied to clipboard",
  className,
  mono = true,
}: CopyFieldProps) {
  async function handleCopy() {
    const ok = await copyText(value);
    if (ok) {
      toast.success(successMessage);
    } else {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-stretch gap-2">
        <code
          className={cn(
            "min-w-0 flex-1 break-all rounded-md border border-border/60 bg-muted/30 px-2.5 py-2 text-xs text-foreground/90",
            mono && "font-mono",
          )}
        >
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" />
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}
