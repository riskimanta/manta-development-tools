export type RunProfilesImportTemplateContext = {
  name: string;
  localPath?: string | null;
  repoUrl?: string | null;
};

function formatOptionalContextLine(
  label: string,
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return `* ${label}: ${trimmed}`;
}

export function buildRunProfilesImportCursorPrompt(
  context: RunProfilesImportTemplateContext,
): string {
  const contextLines = [
    `* ManDev project name: ${context.name}`,
    formatOptionalContextLine("Local path", context.localPath),
    formatOptionalContextLine("Repository URL", context.repoUrl),
  ].filter((line): line is string => line !== null);

  const projectContextBlock =
    contextLines.length > 0
      ? `\nProject context (from ManDev):\n${contextLines.join("\n")}\n`
      : "";

  return `You are inside the target project codebase.
${projectContextBlock}
Create a ManDev run profiles file at:

.mandev/run-profiles.json

Inspect this codebase to discover real commands and scripts. Read files such as:
- package.json
- pnpm-lock.yaml
- yarn.lock
- package-lock.json
- docker-compose.yml
- Dockerfile
- pom.xml
- build.gradle
- requirements.txt
- pyproject.toml
- README.md
- .env.example

Output requirements:
- Create the \`.mandev\` folder if it does not exist.
- Write valid JSON only (no markdown, code fences, or comments).
- The root object must contain a non-empty \`profiles\` array.
- Each profile must include \`name\` and \`command\`.
- Optional fields: \`workingDirectory\` (use \`"."\` for project root), \`description\`, \`isDefault\` (boolean).
- At most one profile may have \`isDefault\`: true.
- Do not invent commands that are not supported by this project.
- Prefer commands already present in package scripts, Makefiles, README, or docs.
- Include useful profiles only when supported (e.g. dev server, build, test, database tools, Docker, backend server).
- Keep commands copy-paste ready for a terminal.

Example shape:

{
  "profiles": [
    {
      "name": "Dev Server",
      "command": "pnpm dev",
      "workingDirectory": ".",
      "description": "Run the development server",
      "isDefault": true
    }
  ]
}

Write the file at \`.mandev/run-profiles.json\` relative to this project root.
After saving, validate that it is valid JSON and show the final file content.

Then open ManDev → Project Detail → "Read run profiles from local path" to import profiles.

Do not modify ManDev or any other repository — only write \`.mandev/run-profiles.json\` in this project.
`;
}
