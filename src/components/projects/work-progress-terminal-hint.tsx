"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const TERMINAL_COMMAND = "mandev track";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function WorkProgressTerminalHint() {
  async function handleCopyCommand() {
    const ok = await copyText(TERMINAL_COMMAND);
    if (ok) {
      toast.success("Terminal command copied to clipboard");
    } else {
      toast.error("Could not copy command");
    }
  }

  return (
    <section className="space-y-2 rounded-md border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Capture from terminal
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2.5 py-2 font-mono text-xs">
          {TERMINAL_COMMAND}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleCopyCommand}
        >
          <Copy className="size-3.5" />
          Copy command
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Run this from the project folder after setting{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
          MANDEV_AGENT_TOKEN
        </code>{" "}
        locally.
      </p>
    </section>
  );
}
