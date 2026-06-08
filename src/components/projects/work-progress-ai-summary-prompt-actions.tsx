"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildWorkProgressAiSummaryPrompt,
  type WorkProgressAiSummaryPromptInput,
} from "@/lib/work-progress-ai-summary-prompt";

type Props = WorkProgressAiSummaryPromptInput;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function WorkProgressAiSummaryPromptActions({ project, session }: Props) {
  const prompt = useMemo(
    () => buildWorkProgressAiSummaryPrompt({ project, session }),
    [project, session],
  );

  async function handleCopyPrompt() {
    const ok = await copyText(prompt);
    if (ok) {
      toast.success("AI summary prompt copied to clipboard");
    } else {
      toast.error("Could not copy AI summary prompt");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleCopyPrompt}
      >
        <Copy className="size-3.5" />
        Copy AI summary prompt
      </Button>
      <p className="text-xs text-muted-foreground">
        Copy a structured prompt for ChatGPT, Claude, or Cursor. ManDev only
        copies a prompt and does not call an AI API.
      </p>
    </div>
  );
}
