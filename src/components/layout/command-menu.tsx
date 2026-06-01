"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FolderKanban, ListTodo, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCommandPaletteRecentAction,
  searchCommandPaletteAction,
} from "@/app/search/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { commandPaletteItems, type NavItem } from "@/config/nav";
import { featureStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CommandPaletteSearchResult } from "@/services/search";

const EMPTY_RESULTS: CommandPaletteSearchResult = {
  projects: [],
  features: [],
};

function matchesNavQuery(item: NavItem, query: string) {
  const haystack = `${item.label} ${item.href} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function projectSubtitle(project: CommandPaletteSearchResult["projects"][number]) {
  if (project.description?.trim()) {
    return project.description.trim();
  }
  return project.slug;
}

type EntityNavigate = (href: string) => void;

function ProjectCommandItems({
  projects,
  navigate,
}: {
  projects: CommandPaletteSearchResult["projects"];
  navigate: EntityNavigate;
}) {
  return projects.map((project) => (
    <CommandItem
      key={project.id}
      value={`project-${project.id}-${project.name}-${project.slug}`}
      onSelect={() => navigate(`/projects/${project.id}`)}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <FolderKanban className="size-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{project.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {projectSubtitle(project)}
        </span>
      </span>
    </CommandItem>
  ));
}

function FeatureCommandItems({
  features,
  navigate,
}: {
  features: CommandPaletteSearchResult["features"];
  navigate: EntityNavigate;
}) {
  return features.map((feature) => (
    <CommandItem
      key={feature.id}
      value={`feature-${feature.id}-${feature.title}-${feature.project.name}`}
      onSelect={() => navigate(`/features/${feature.id}`)}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <ListTodo className="size-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{feature.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {feature.project.name}
        </span>
      </span>
      <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
        {featureStatusLabel(feature.status)}
      </Badge>
    </CommandItem>
  ));
}

const groupClassName =
  "px-1 py-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [recent, setRecent] = useState(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const filteredNav = useMemo(
    () =>
      hasQuery
        ? commandPaletteItems.filter((item) => matchesNavQuery(item, trimmedQuery))
        : commandPaletteItems,
    [hasQuery, trimmedQuery],
  );

  const hasNav = filteredNav.length > 0;
  const hasProjects = results.projects.length > 0;
  const hasFeatures = results.features.length > 0;
  const hasRecentProjects = recent.projects.length > 0;
  const hasRecentFeatures = recent.features.length > 0;
  const showGlobalEmpty =
    hasQuery && !isSearching && !hasNav && !hasProjects && !hasFeatures;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || hasQuery) {
      setRecent(EMPTY_RESULTS);
      return;
    }

    let cancelled = false;

    void getCommandPaletteRecentAction().then((next) => {
      if (!cancelled) {
        setRecent(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, hasQuery]);

  useEffect(() => {
    if (!open || !hasQuery) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = window.setTimeout(() => {
      void searchCommandPaletteAction(trimmedQuery)
        .then((next) => {
          if (!cancelled) {
            setResults(next);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, hasQuery, trimmedQuery]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults(EMPTY_RESULTS);
      setRecent(EMPTY_RESULTS);
      setIsSearching(false);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "shrink-0 sm:hidden",
        )}
      >
        <Search className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "hidden h-8 max-w-[14rem] flex-1 cursor-text items-center justify-start gap-2 px-2 text-muted-foreground sm:flex md:max-w-md",
        )}
      >
        <Search className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate text-left text-xs">Search or jump…</span>
        <kbd className="pointer-events-none ml-auto hidden items-center gap-0.5 rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        label="ManDev command menu"
        description="Search pages, projects, and features. Use arrow keys to navigate and Enter to open."
        shouldFilter={false}
        contentClassName={cn(
          "overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-xl",
          "max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),32rem)]",
        )}
        overlayClassName="dark:bg-black/40"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search pages, projects, features…"
          className="h-11 w-full border-0 border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
        />
        <CommandList className="max-h-[min(55vh,22rem)] overflow-y-auto p-1">
          {showGlobalEmpty ? (
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No matches.
            </CommandEmpty>
          ) : null}

          {hasNav ? (
            <CommandGroup heading="Navigation" className={groupClassName}>
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`nav-${item.href}`}
                    onSelect={() => navigate(item.href)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Icon className="size-4 shrink-0 opacity-70" />
                    {item.label}
                    <span className="ml-auto truncate font-mono text-[10px] text-muted-foreground">
                      {item.href}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          {!hasQuery && hasRecentProjects ? (
            <CommandGroup heading="Recent projects" className={groupClassName}>
              <ProjectCommandItems projects={recent.projects} navigate={navigate} />
            </CommandGroup>
          ) : null}

          {!hasQuery && hasRecentFeatures ? (
            <CommandGroup heading="Recent features" className={groupClassName}>
              <FeatureCommandItems features={recent.features} navigate={navigate} />
            </CommandGroup>
          ) : null}

          {hasQuery ? (
            <CommandGroup heading="Projects" className={groupClassName}>
              {isSearching && !hasProjects ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">Searching…</p>
              ) : null}
              {!isSearching && !hasProjects ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No projects match your search.
                </p>
              ) : null}
              <ProjectCommandItems projects={results.projects} navigate={navigate} />
            </CommandGroup>
          ) : null}

          {hasQuery ? (
            <CommandGroup heading="Features" className={groupClassName}>
              {isSearching && !hasFeatures ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">Searching…</p>
              ) : null}
              {!isSearching && !hasFeatures ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No features match your search.
                </p>
              ) : null}
              <FeatureCommandItems features={results.features} navigate={navigate} />
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
