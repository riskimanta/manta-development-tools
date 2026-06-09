"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WORK_PROGRESS_TERMINAL_TOKEN_HINT } from "@/lib/work-progress-session-ui";

const TERMINAL_COMMAND = "mandev track";
const WATCH_COMMAND = "mandev track --watch";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CommandRow({
  command,
  copyLabel,
}: {
  command: string;
  copyLabel: string;
}) {
  async function handleCopy() {
    const ok = await copyText(command);
    if (ok) {
      toast.success("Command copied to clipboard");
    } else {
      toast.error("Could not copy command");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2.5 py-2 font-mono text-xs">
        {command}
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
  );
}

export function WorkProgressTerminalHint() {
  return (
    <section className="space-y-2 rounded-md border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Capture from terminal
      </p>
      <div className="space-y-2">
        <CommandRow command={TERMINAL_COMMAND} copyLabel="Copy command" />
        <CommandRow command={WATCH_COMMAND} copyLabel="Copy watch command" />
      </div>
      <p className="text-xs text-muted-foreground">
        {WORK_PROGRESS_TERMINAL_TOKEN_HINT}
      </p>
    </section>
  );
}
