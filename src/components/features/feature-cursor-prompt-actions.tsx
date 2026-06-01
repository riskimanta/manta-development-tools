"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildFeatureCursorPrompt,
  type FeatureCursorPromptInput,
} from "@/lib/cursor-prompt";

type Props = FeatureCursorPromptInput;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function FeatureCursorPromptActions({ project, feature }: Props) {
  const prompt = useMemo(
    () => buildFeatureCursorPrompt({ project, feature }),
    [project, feature],
  );

  async function handleCopyPrompt() {
    const ok = await copyText(prompt);
    if (ok) {
      toast.success("Cursor prompt copied to clipboard");
    } else {
      toast.error("Could not copy Cursor prompt");
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Cursor prompt</CardTitle>
        <CardDescription>
          Copy a ready-made implementation prompt and paste it into Cursor to
          start work on this feature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleCopyPrompt}
        >
          <Copy className="size-3.5" />
          Copy Cursor Prompt
        </Button>

        <details className="group rounded-md border border-border/80 bg-muted/20">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            Preview prompt
          </summary>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-border/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90">
            {prompt}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
