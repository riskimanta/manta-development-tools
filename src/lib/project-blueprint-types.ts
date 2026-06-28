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
  | "enterprise-backend"
  | "result-md-workflow-discipline"
  | "auto-error-recovery-loop"
  | "git-automation-guardrails"
  | "cicd-pipeline-discipline"
  | "deployment-automation-guard"
  | "branch-release-policy"
  | "rule-skill-sync-automation"
  | "environment-secret-safety"
  | "smoke-test-health-check"
  | "rollback-failure-protocol"
  | "dependency-update-safety"
  | "pr-review-self-checklist";

export type ProjectBlueprintAutomationLevel =
  | "manual-assisted"
  | "safe-autopilot"
  | "full-autopilot";

export const DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL: ProjectBlueprintAutomationLevel =
  "safe-autopilot";

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
  "result-md-workflow-discipline",
  "auto-error-recovery-loop",
  "git-automation-guardrails",
  "cicd-pipeline-discipline",
  "deployment-automation-guard",
  "branch-release-policy",
  "rule-skill-sync-automation",
  "environment-secret-safety",
  "smoke-test-health-check",
  "rollback-failure-protocol",
  "dependency-update-safety",
  "pr-review-self-checklist",
];

export const AUTOMATION_RULE_PACKS: ProjectBlueprintRulePack[] = [
  "result-md-workflow-discipline",
  "auto-error-recovery-loop",
  "git-automation-guardrails",
  "cicd-pipeline-discipline",
  "deployment-automation-guard",
  "branch-release-policy",
  "rule-skill-sync-automation",
  "environment-secret-safety",
  "smoke-test-health-check",
  "rollback-failure-protocol",
  "dependency-update-safety",
  "pr-review-self-checklist",
];

export const CORE_RULE_PACKS: ProjectBlueprintRulePack[] =
  PROJECT_BLUEPRINT_RULE_PACKS.filter((pack) => !AUTOMATION_RULE_PACKS.includes(pack));

export const PROJECT_BLUEPRINT_AUTOMATION_LEVELS: ProjectBlueprintAutomationLevel[] =
  ["manual-assisted", "safe-autopilot", "full-autopilot"];

export type ProjectBlueprintAutomationLevelConfig = {
  label: string;
  description: string;
  safetyPolicyText: string;
};

export const PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG: Record<
  ProjectBlueprintAutomationLevel,
  ProjectBlueprintAutomationLevelConfig
> = {
  "manual-assisted": {
    label: "Manual Assisted",
    description: "AI gives guidance; you decide commit, push, merge, and deploy.",
    safetyPolicyText:
      "Operate in manual-assisted mode. Provide recommendations and draft changes, but the user decides when to commit, push, open or merge pull requests, and deploy. Never merge or deploy without explicit user approval.",
  },
  "safe-autopilot": {
    label: "Safe Autopilot",
    description:
      "AI may branch, validate, fix errors, commit, push, and open PRs. Merge and deploy need approval.",
    safetyPolicyText:
      "Operate in safe-autopilot mode. You may create feature/fix/chore/docs branches, run validation, fix errors, stage scoped files, commit after validations pass, push branches, and create pull requests. Do not merge pull requests or deploy without explicit user approval, even when CI passes.",
  },
  "full-autopilot": {
    label: "Full Autopilot",
    description:
      "AI may merge and deploy automatically only when all gates pass and project policy allows.",
    safetyPolicyText:
      "Operate in full-autopilot mode. You may merge pull requests and deploy automatically only when all CI gates pass, required environment variables are validated, smoke checks succeed, and the project's deployment and rollback policies allow it. Stop and report to RESULT.md if any gate fails or policy is unclear.",
  },
};

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
  "result-md-workflow-discipline": "RESULT.md Workflow Discipline",
  "auto-error-recovery-loop": "Auto Error Recovery Loop",
  "git-automation-guardrails": "Git Automation Guardrails",
  "cicd-pipeline-discipline": "CI/CD Pipeline Discipline",
  "deployment-automation-guard": "Deployment Automation Guard",
  "branch-release-policy": "Branch & Release Policy",
  "rule-skill-sync-automation": "Rule/Skill Sync Automation",
  "environment-secret-safety": "Environment & Secret Safety",
  "smoke-test-health-check": "Smoke Test & Health Check",
  "rollback-failure-protocol": "Rollback & Failure Protocol",
  "dependency-update-safety": "Dependency Update Safety",
  "pr-review-self-checklist": "PR Review Self-Checklist",
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
  "result-md-workflow-discipline": "result-md-workflow-discipline.mdc",
  "auto-error-recovery-loop": "auto-error-recovery-loop.mdc",
  "git-automation-guardrails": "git-automation-guardrails.mdc",
  "cicd-pipeline-discipline": "cicd-pipeline-discipline.mdc",
  "deployment-automation-guard": "deployment-automation-guard.mdc",
  "branch-release-policy": "branch-release-policy.mdc",
  "rule-skill-sync-automation": "rule-skill-sync-automation.mdc",
  "environment-secret-safety": "environment-secret-safety.mdc",
  "smoke-test-health-check": "smoke-test-health-check.mdc",
  "rollback-failure-protocol": "rollback-failure-protocol.mdc",
  "dependency-update-safety": "dependency-update-safety.mdc",
  "pr-review-self-checklist": "pr-review-self-checklist.mdc",
};

const BASE_DEFAULT_RULE_PACKS: ProjectBlueprintRulePack[] = [
  "core-safe-change",
  "ai-coding-guardrails",
  "testing-validation",
  "documentation-discipline",
  "result-md-workflow-discipline",
  "auto-error-recovery-loop",
  "git-automation-guardrails",
  "cicd-pipeline-discipline",
  "environment-secret-safety",
  "smoke-test-health-check",
  "branch-release-policy",
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
  automationLevel: ProjectBlueprintAutomationLevel;
  rulePacks: ProjectBlueprintRulePack[];
  customNotes?: string;
};
