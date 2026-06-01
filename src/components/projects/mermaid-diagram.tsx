"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export type MermaidDiagramVariant = "compact" | "full";

type Props = {
  source: string;
  className?: string;
  /** compact: bounded preview in the card. full: larger scrollable area in a dialog. */
  variant?: MermaidDiagramVariant;
};

const variantFrameClass: Record<MermaidDiagramVariant, string> = {
  compact: "max-h-72 overflow-auto",
  full: "max-h-[min(70vh,720px)] overflow-auto",
};

export function MermaidDiagram({
  source,
  className,
  variant = "compact",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId().replace(/:/g, "");
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      setRendering(true);
      setError(null);

      const container = containerRef.current;
      if (!container) {
        return;
      }

      container.innerHTML = "";

      const trimmed = source.trim();
      if (!trimmed) {
        setError("Diagram source is empty.");
        setRendering(false);
        return;
      }

      try {
        const mermaid = (await import("mermaid")).default;
        const theme = resolvedTheme === "dark" ? "dark" : "default";

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme,
        });

        const renderId = `mermaid-${baseId}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, trimmed);

        if (cancelled) {
          return;
        }

        container.innerHTML = svg;
        setError(null);
      } catch {
        if (!cancelled) {
          setError(
            "Diagram could not be rendered. Please check the Mermaid syntax.",
          );
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme, baseId]);

  return (
    <div className={className}>
      {rendering && !error ? (
        <p className="text-sm text-muted-foreground">Rendering diagram…</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div
        className={cn(
          "rounded-md border border-border/80 bg-muted/20 p-3",
          !error && variantFrameClass[variant],
        )}
      >
        <div
          ref={containerRef}
          className={cn(
            "min-w-0 overflow-x-auto",
            "[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full",
            "dark:[&_svg]:drop-shadow-sm",
          )}
          aria-hidden={Boolean(error)}
        />
      </div>
    </div>
  );
}
