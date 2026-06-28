export type ProjectBlueprintProjectType =
  | "saas-dashboard"
  | "internal-admin-tool"
  | "frontend-web-app"
  | "fullstack-app"
  | "api-backend"
  | "cli-tool"
  | "documentation-site"
  | "data-tool"
  | "custom";

export type ProjectBlueprintStackProfile =
  | "nextjs-typescript-tailwind"
  | "nextjs-prisma-sqlite"
  | "nextjs-prisma-postgresql"
  | "react-spa"
  | "angular-spring-boot"
  | "spring-boot-api"
  | "nodejs-cli"
  | "documentation-markdown"
  | "custom";

export type ProjectBlueprintArchitectureStyle =
  | "simple-mvp"
  | "feature-based"
  | "modular-monolith"
  | "layered-service"
  | "clean-architecture"
  | "local-first-tool"
  | "custom";

export type ProjectBlueprintRulePack =
  | "core-safe-change"
  | "ai-coding-guardrails"
  | "frontend-ui-consistency"
  | "nextjs-app-router-safety"
  | "database-migration-safety"
  | "testing-validation"
  | "documentation-discipline"
  | "local-first-tooling"
  | "enterprise-backend";

export const PROJECT_BLUEPRINT_PROJECT_TYPES: ProjectBlueprintProjectType[] = [
  "saas-dashboard",
  "internal-admin-tool",
  "frontend-web-app",
  "fullstack-app",
  "api-backend",
  "cli-tool",
  "documentation-site",
  "data-tool",
  "custom",
];

export const PROJECT_BLUEPRINT_STACK_PROFILES: ProjectBlueprintStackProfile[] = [
  "nextjs-typescript-tailwind",
  "nextjs-prisma-sqlite",
  "nextjs-prisma-postgresql",
  "react-spa",
  "angular-spring-boot",
  "spring-boot-api",
  "nodejs-cli",
  "documentation-markdown",
  "custom",
];

export const PROJECT_BLUEPRINT_ARCHITECTURE_STYLES: ProjectBlueprintArchitectureStyle[] =
  [
    "simple-mvp",
    "feature-based",
    "modular-monolith",
    "layered-service",
    "clean-architecture",
    "local-first-tool",
    "custom",
  ];

export const PROJECT_BLUEPRINT_RULE_PACKS: ProjectBlueprintRulePack[] = [
  "core-safe-change",
  "ai-coding-guardrails",
  "frontend-ui-consistency",
  "nextjs-app-router-safety",
  "database-migration-safety",
  "testing-validation",
  "documentation-discipline",
  "local-first-tooling",
  "enterprise-backend",
];

export const PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS: Record<
  ProjectBlueprintProjectType,
  string
> = {
  "saas-dashboard": "SaaS Dashboard",
  "internal-admin-tool": "Internal Admin Tool",
  "frontend-web-app": "Frontend Web App",
  "fullstack-app": "Fullstack App",
  "api-backend": "API Backend",
  "cli-tool": "CLI Tool",
  "documentation-site": "Documentation Site",
  "data-tool": "Data Tool",
  custom: "Custom",
};

export const PROJECT_BLUEPRINT_STACK_PROFILE_LABELS: Record<
  ProjectBlueprintStackProfile,
  string
> = {
  "nextjs-typescript-tailwind": "Next.js + TypeScript + Tailwind",
  "nextjs-prisma-sqlite": "Next.js + Prisma + SQLite",
  "nextjs-prisma-postgresql": "Next.js + Prisma + PostgreSQL",
  "react-spa": "React SPA",
  "angular-spring-boot": "Angular + Spring Boot",
  "spring-boot-api": "Spring Boot API",
  "nodejs-cli": "Node.js CLI",
  "documentation-markdown": "Documentation / Markdown",
  custom: "Custom",
};

export const PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS: Record<
  ProjectBlueprintArchitectureStyle,
  string
> = {
  "simple-mvp": "Simple MVP",
  "feature-based": "Feature-based folders",
  "modular-monolith": "Modular monolith",
  "layered-service": "Layered service architecture",
  "clean-architecture": "Clean architecture",
  "local-first-tool": "Local-first tool",
  custom: "Custom",
};

export const PROJECT_BLUEPRINT_RULE_PACK_LABELS: Record<
  ProjectBlueprintRulePack,
  string
> = {
  "core-safe-change": "Core Safe Change Protocol",
  "ai-coding-guardrails": "AI Coding Guardrails",
  "frontend-ui-consistency": "Frontend UI Consistency",
  "nextjs-app-router-safety": "Next.js App Router Safety",
  "database-migration-safety": "Database Migration Safety",
  "testing-validation": "Testing & Validation Discipline",
  "documentation-discipline": "Documentation Discipline",
  "local-first-tooling": "Local-first Tooling",
  "enterprise-backend": "Enterprise Backend Discipline",
};

export const RULE_PACK_CURSOR_RULE_FILES: Record<
  ProjectBlueprintRulePack,
  string
> = {
  "core-safe-change": "safe-change-protocol.mdc",
  "ai-coding-guardrails": "ai-coding-guardrails.mdc",
  "frontend-ui-consistency": "frontend-ui-consistency.mdc",
  "nextjs-app-router-safety": "nextjs-app-router-safety.mdc",
  "database-migration-safety": "database-migration-safety.mdc",
  "testing-validation": "validation-discipline.mdc",
  "documentation-discipline": "documentation-discipline.mdc",
  "local-first-tooling": "local-first-tooling.mdc",
  "enterprise-backend": "enterprise-backend-discipline.mdc",
};

const BASE_DEFAULT_RULE_PACKS: ProjectBlueprintRulePack[] = [
  "core-safe-change",
  "ai-coding-guardrails",
  "testing-validation",
  "documentation-discipline",
];

export function getDefaultRulePacksForStack(
  stackProfile: ProjectBlueprintStackProfile,
): ProjectBlueprintRulePack[] {
  const stackLabel = PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[stackProfile];
  const packs = new Set(BASE_DEFAULT_RULE_PACKS);

  if (stackLabel.includes("Next.js")) {
    packs.add("nextjs-app-router-safety");
    packs.add("frontend-ui-consistency");
  }

  if (
    stackLabel.includes("Prisma") ||
    stackLabel.includes("PostgreSQL") ||
    stackLabel.includes("SQLite")
  ) {
    packs.add("database-migration-safety");
  }

  if (stackLabel.includes("Spring Boot")) {
    packs.add("enterprise-backend");
    packs.add("database-migration-safety");
  }

  return PROJECT_BLUEPRINT_RULE_PACKS.filter((pack) => packs.has(pack));
}

export type ProjectBlueprintInput = {
  localPath?: string;
  projectType: ProjectBlueprintProjectType;
  stackProfile: ProjectBlueprintStackProfile;
  architectureStyle: ProjectBlueprintArchitectureStyle;
  rulePacks: ProjectBlueprintRulePack[];
  customNotes?: string;
};
