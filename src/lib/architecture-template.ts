export type ArchitectureTemplateContext = {
  name: string;
  repoUrl?: string | null;
  localPath?: string | null;
};

function escapeMermaidLabel(value: string): string {
  return value.replace(/"/g, '\\"');
}

export function buildDefaultArchitectureTemplate(
  context: ArchitectureTemplateContext,
): string {
  const projectLabel = escapeMermaidLabel(context.name);
  const lines = [
    "flowchart TD",
    `  subgraph ${projectLabel}["${projectLabel}"]`,
    "    User[User] --> UI[Frontend / UI Layer]",
    "    UI --> Actions[Actions / API Layer]",
    "    Actions --> Services[Service Layer]",
    "    Services --> Data[Data Access Layer]",
    "    Data --> DB[(Database)]",
    "    UI --> Auth[Auth / Session]",
    "    Actions --> Validation[Validation]",
    "  end",
  ];

  if (context.repoUrl) {
    lines.push(`  Repo["Repository"] -.-> ${projectLabel}`);
  }

  if (context.localPath) {
    lines.push(`  Local["Local workspace"] -.-> ${projectLabel}`);
  }

  return lines.join("\n");
}
