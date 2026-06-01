"use client";

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

type Props = {
  localPath: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ProjectLocalPathActions({ localPath }: Props) {
  const cursorCommand = `cursor "${localPath}"`;

  async function handleCopyPath() {
    const ok = await copyText(localPath);
    if (ok) {
      toast.success("Local path copied to clipboard");
    } else {
      toast.error("Could not copy local path");
    }
  }

  async function handleCopyCommand() {
    const ok = await copyText(cursorCommand);
    if (ok) {
      toast.success("Cursor command copied to clipboard");
    } else {
      toast.error("Could not copy command");
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Open locally</CardTitle>
        <CardDescription>
          Paste the path into Terminal or Cursor to jump to this codebase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Local path</p>
          <code className="block break-all rounded-md bg-muted px-2.5 py-2 font-mono text-xs">
            {localPath}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopyPath}
          >
            <Copy className="size-3.5" />
            Copy local path
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Terminal command
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2.5 py-2 font-mono text-xs">
              {cursorCommand}
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
            Run in Terminal when the{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              cursor
            </code>{" "}
            CLI is installed and on your PATH.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
