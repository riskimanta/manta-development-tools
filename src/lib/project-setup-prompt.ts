export type ProjectSetupPromptInput = {
  localPath?: string;
};

function formatLocalPathContext(localPath: string | undefined): string {
  const trimmed = localPath?.trim();
  if (trimmed) {
    return `Target project local path (from ManDev): ${trimmed}\n`;
  }
  return "Use the current workspace root as the target project.\n";
}

export function buildProjectSetupPrompt(input: ProjectSetupPromptInput = {}): string {
  const localPathContext = formatLocalPathContext(input.localPath);

  return `You are inside a local project that will be registered in ManDev.

${localPathContext}
Your task:
1. Inspect the project structure.
2. Read safe public metadata only.
3. Do not read secrets such as .env files.
4. Create or update a .mandev folder.
5. Generate:
   - .mandev/project.json
   - .mandev/run-profiles.json
   - .mandev/architecture.json
6. Keep all files concise and valid JSON.
7. Do not modify application source code unless necessary.
8. Do not install packages.
9. Do not run destructive commands.

## .mandev/project.json

Write valid JSON with these fields:

{
  "name": "Project Name",
  "slug": "project-name",
  "description": "A concise description of what this project does.",
  "repositoryUrl": "https://github.com/owner/repo",
  "notes": "Optional notes about framework, runtime, or setup."
}

- Derive values from package.json, README, git remote, and project structure.
- \`slug\` must be lowercase with hyphens only.
- \`repositoryUrl\` should be a normalized https URL when available.

## .mandev/run-profiles.json

Write valid JSON matching the ManDev run profiles import format:

{
  "profiles": [
    {
      "name": "Dev Server",
      "command": "pnpm dev",
      "workingDirectory": ".",
      "description": "Start the local development server.",
      "isDefault": true
    },
    {
      "name": "Build",
      "command": "pnpm build",
      "workingDirectory": ".",
      "description": "Create a production build.",
      "isDefault": false
    }
  ]
}

- Include only commands supported by this project (e.g. dev server, build, test, lint, typecheck, database migrate).
- Prefer commands from package.json scripts, Makefiles, README, or docs.
- At most one profile may have \`isDefault\`: true.
- Do not invent commands that are not supported.

## .mandev/architecture.json

Write valid JSON matching the ManDev architecture import format:

{
  "summary": "Short high-level summary of the system.",
  "mermaidSource": "flowchart TD\\n  App[\\"App\\"] --> UI[\\"UI\\"]\\n  App --> Services[\\"Services\\"]",
  "notes": "Optional notes about runtime, data layer, or integrations.",
  "detailSections": [
    {
      "title": "Important directories",
      "content": "src/app — routes; src/services — business logic."
    }
  ]
}

- \`mermaidSource\` must use Mermaid \`flowchart TD\`.
- Use simple node IDs (App, UI, Services, DB) with labels in double quotes.
- Include main runtime/framework, data layer, and API/server layer when identifiable.
- Do not invent services that do not exist in the codebase.

After writing all files, validate that each file is valid JSON and show the final contents.

Then return to ManDev → New Project, enter the local path, and click **Detect from local path** to import the metadata.
`;
}
