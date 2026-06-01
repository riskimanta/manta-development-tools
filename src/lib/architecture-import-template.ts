export type ArchitectureImportTemplateContext = {
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

export function buildArchitectureImportCursorPrompt(
  context: ArchitectureImportTemplateContext,
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
Create a ManDev architecture file at:

.mandev/architecture.json

Analyze this codebase and produce a concise architecture summary and a valid Mermaid diagram.

Output requirements:
- Create the \`.mandev\` folder if it does not exist.
- Write valid JSON only.
- The JSON must contain:
  - "summary": string
  - "mermaidSource": string
- \`mermaidSource\` must use Mermaid \`flowchart TD\`.
- Use simple node IDs like App, UI, Actions, Services, DB, Auth.
- Put display labels inside double quotes.
- Do not use spaces in node IDs.
- Do not use markdown, code fences, emojis, HTML tags, comments, or semicolons.
- Keep the architecture high-level and readable.
- Include the main app layers, data flow, auth/session, database, external APIs if present, and important integrations.
- Do not invent services that do not exist in the codebase.
- After writing the file, validate that it is valid JSON.
- Show the final file content.

Write the file at \`.mandev/architecture.json\` relative to this project root.

After saving, commit the file to Git:

git add .mandev/architecture.json
git commit -m "Add ManDev architecture file"

Then open ManDev → Project Detail → "Read architecture from local path" to import the diagram.

Do not modify ManDev or any other repository — only write \`.mandev/architecture.json\` in this project.
`;
}
