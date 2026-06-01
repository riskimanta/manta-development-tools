import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  PlusCircle,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  keywords?: string[];
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, keywords: ["repos", "apps"] },
  { href: "/backlog", label: "Backlog", icon: ClipboardList, keywords: ["planning", "roadmap"] },
  { href: "/features", label: "Features", icon: ListTodo, keywords: ["specs", "tasks"] },
];

/** Extra entries for the ⌘K palette (not shown in sidebar). */
export const commandPaletteExtras: NavItem[] = [
  {
    href: "/projects/new",
    label: "New project",
    icon: PlusCircle,
    keywords: ["create", "add"],
  },
  {
    href: "/features/new",
    label: "New feature",
    icon: PlusCircle,
    keywords: ["create", "add", "spec"],
  },
];

export const commandPaletteItems: NavItem[] = [
  ...mainNav,
  ...commandPaletteExtras,
];
