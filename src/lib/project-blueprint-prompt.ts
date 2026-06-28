import {
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
  RULE_PACK_CURSOR_RULE_FILES,
  type ProjectBlueprintInput,
  type ProjectBlueprintRulePack,
  type ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";

function formatLocalPathContext(localPath: string | undefined): string {
  const trimmed = localPath?.trim();
  if (trimmed) {
    return `Target project local path (from ManDev): ${trimmed}\n`;
  }
  return "Use the current workspace root as the target project.\n";
}

function formatRulePacksList(rulePacks: ProjectBlueprintRulePack[]): string {
  return rulePacks
    .map((pack) => `- ${PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]} (\`${pack}\`)`)
    .join("\n");
}

function formatCursorRuleFiles(rulePacks: ProjectBlueprintRulePack[]): string {
  return rulePacks
    .map((pack) => `- \`.cursor/rules/${RULE_PACK_CURSOR_RULE_FILES[pack]}\``)
    .join("\n");
}

function getRunProfilesExample(stackProfile: ProjectBlueprintStackProfile): string {
  const stackLabel = PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[stackProfile];

  if (stackLabel.includes("Spring Boot")) {
    return `{
  "profiles": [
    {
      "name": "Run API",
      "command": "./mvnw spring-boot:run",
      "workingDirectory": ".",
      "description": "Start the Spring Boot API.",
      "isDefault": true
    },
    {
      "name": "Test",
      "command": "./mvnw test",
      "workingDirectory": ".",
      "description": "Run backend tests.",
      "isDefault": false
    },
    {
      "name": "Package",
      "command": "./mvnw clean package",
      "workingDirectory": ".",
      "description": "Build the application package.",
      "isDefault": false
    }
  ]
}`;
  }

  if (stackProfile === "documentation-markdown") {
    return `{
  "profiles": [
    {
      "name": "Preview Docs",
      "command": "echo \\"Open README.md or docs index\\"",
      "workingDirectory": ".",
      "description": "Placeholder docs preview command.",
      "isDefault": true
    }
  ]
}`;
  }

  if (stackProfile === "nodejs-cli") {
    return `{
  "profiles": [
    {
      "name": "Dev",
      "command": "pnpm dev",
      "workingDirectory": ".",
      "description": "Run the CLI in development mode.",
      "isDefault": true
    },
    {
      "name": "Test",
      "command": "pnpm test",
      "workingDirectory": ".",
      "description": "Run the test suite.",
      "isDefault": false
    },
    {
      "name": "Build",
      "command": "pnpm build",
      "workingDirectory": ".",
      "description": "Build the CLI package.",
      "isDefault": false
    }
  ]
}`;
  }

  if (stackLabel.includes("Next.js")) {
    return `{
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
    },
    {
      "name": "Test",
      "command": "pnpm test",
      "workingDirectory": ".",
      "description": "Run the test suite.",
      "isDefault": false
    },
    {
      "name": "Typecheck",
      "command": "pnpm typecheck",
      "workingDirectory": ".",
      "description": "Run TypeScript type checking.",
      "isDefault": false
    },
    {
      "name": "Lint",
      "command": "pnpm lint",
      "workingDirectory": ".",
      "description": "Run lint checks.",
      "isDefault": false
    }
  ]
}`;
  }

  if (stackProfile === "react-spa") {
    return `{
  "profiles": [
    {
      "name": "Dev Server",
      "command": "pnpm dev",
      "workingDirectory": ".",
      "description": "Start the Vite development server.",
      "isDefault": true
    },
    {
      "name": "Build",
      "command": "pnpm build",
      "workingDirectory": ".",
      "description": "Create a production build.",
      "isDefault": false
    },
    {
      "name": "Test",
      "command": "pnpm test",
      "workingDirectory": ".",
      "description": "Run the test suite.",
      "isDefault": false
    }
  ]
}`;
  }

  return `{
  "profiles": [
    {
      "name": "Dev",
      "command": "echo \\"Configure the primary dev command for this stack\\"",
      "workingDirectory": ".",
      "description": "Primary development command for this project.",
      "isDefault": true
    },
    {
      "name": "Test",
      "command": "echo \\"Configure the test command for this stack\\"",
      "workingDirectory": ".",
      "description": "Run project tests.",
      "isDefault": false
    }
  ]
}`;
}

function getStackGuidance(stackProfile: ProjectBlueprintStackProfile): string {
  const stackLabel = PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[stackProfile];
  const lines: string[] = [];

  if (stackLabel.includes("Next.js")) {
    lines.push(
      "- Use Next.js App Router conventions (src/app, Server Components, Server Actions).",
      "- Prefer thin routes/actions and domain logic in services or lib modules.",
      "- Include frontend UI layer guidance when applicable.",
    );
  }

  if (stackLabel.includes("Prisma")) {
    lines.push(
      "- Include a database/data layer in architecture metadata.",
      "- Add Prisma migrate/generate run profiles when appropriate.",
      "- Follow database migration safety rules for schema changes.",
    );
  }

  if (stackLabel.includes("PostgreSQL") || stackLabel.includes("SQLite")) {
    lines.push("- Document the chosen database in architecture metadata.");
  }

  if (stackLabel.includes("Spring Boot")) {
    lines.push(
      "- Use layered backend structure (controller, service, repository).",
      "- Include API/backend layer guidance in architecture metadata.",
      "- Prefer Maven wrapper commands in run profiles.",
    );
  }

  if (stackProfile === "documentation-markdown") {
    lines.push(
      "- Keep structure documentation-focused with README and optional docs/ folder.",
      "- Run profiles may be placeholders until a docs tool is chosen.",
    );
  }

  if (stackProfile === "nodejs-cli") {
    lines.push(
      "- Document CLI entry points and command structure.",
      "- Include local tooling layer in architecture metadata.",
    );
  }

  if (lines.length === 0) {
    lines.push("- Adapt folder structure and run profiles to the selected stack.");
  }

  return lines.join("\n");
}

function formatCustomNotesBlock(customNotes: string | undefined): string {
  const trimmed = customNotes?.trim();
  if (!trimmed) {
    return "";
  }
  return `\n## Additional instructions from ManDev\n\n${trimmed}\n`;
}

export function buildProjectBlueprintPrompt(input: ProjectBlueprintInput): string {
  const {
    localPath,
    projectType,
    stackProfile,
    architectureStyle,
    rulePacks,
    customNotes,
  } = input;

  const projectTypeLabel = PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS[projectType];
  const stackLabel = PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[stackProfile];
  const architectureLabel =
    PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS[architectureStyle];
  const localPathContext = formatLocalPathContext(localPath);
  const runProfilesExample = getRunProfilesExample(stackProfile);
  const stackGuidance = getStackGuidance(stackProfile);
  const rulePacksList = formatRulePacksList(rulePacks);
  const cursorRuleFiles = formatCursorRuleFiles(rulePacks);
  const customNotesBlock = formatCustomNotesBlock(customNotes);

  const blueprintJsonExample = JSON.stringify(
    {
      projectType,
      stackProfile,
      architectureStyle,
      rulePacks,
      customNotes: customNotes?.trim() || "Optional user notes.",
      createdBy: "ManDev Project Blueprint Starter",
    },
    null,
    2,
  );

  const rulePacksForResult = rulePacks
    .map((pack) => PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack])
    .join(", ");

  return `You are initializing a brand-new project from the ManDev Project Blueprint Starter.

${localPathContext}
Treat this as a new project initialization inside the target folder.
Read safe public files only when needed to infer a project name.
Do not read secrets such as \`.env\` files.
Do not read credentials or private keys.
Do not install packages unless explicitly asked.
Do not run destructive commands.
Do not modify unrelated repositories.
Ask before any destructive change.
Keep output concise, valid, and practical — avoid overengineering.

## Selected blueprint

- Project type: ${projectTypeLabel} (\`${projectType}\`)
- Stack profile: ${stackLabel} (\`${stackProfile}\`)
- Architecture style: ${architectureLabel} (\`${architectureStyle}\`)
- Rule packs:
${rulePacksList}
${customNotesBlock}
## Your task

1. Create or update the \`.mandev\` folder.
2. Create or update the \`.cursor/rules\` folder.
3. Create starter architecture metadata and onboarding notes.
4. Create \`README.md\` and \`RESULT.md\`.
5. Generate Cursor rules matching the selected rule packs.
6. Keep all JSON files valid and concise.
7. Do not scaffold application source code unless the folder is empty and a minimal starter is clearly required — focus on metadata, rules, and documentation first.

## Stack-specific guidance

${stackGuidance}

## Files to create

### ManDev metadata

- \`.mandev/project.json\`
- \`.mandev/run-profiles.json\`
- \`.mandev/architecture.json\`
- \`.mandev/blueprint.json\`
- \`.mandev/onboarding.md\`

### Cursor rules

${cursorRuleFiles}

Each \`.mdc\` rule file should include YAML frontmatter with \`description\` and practical guardrails for that pack.
Keep rules concise and actionable.

### Project docs

- \`README.md\`
- \`RESULT.md\`

## .mandev/project.json

Write valid JSON:

{
  "name": "Project Name",
  "slug": "project-name",
  "description": "A concise description of the project.",
  "repositoryUrl": "",
  "notes": "Created from ManDev Project Blueprint Starter."
}

- Derive \`name\` and \`slug\` from the folder name when possible.
- \`slug\` must be lowercase with hyphens only.

## .mandev/blueprint.json

Write valid JSON recording the selected blueprint:

${blueprintJsonExample}

## .mandev/run-profiles.json

Write valid JSON matching the ManDev run profiles import format.
Adapt commands to the selected stack (${stackLabel}).

Example shape for this stack:

${runProfilesExample}

- At most one profile may have \`isDefault\`: true.
- Prefer real commands for the stack; use placeholders only when necessary.

## .mandev/architecture.json

Write valid JSON matching the ManDev architecture import format:

{
  "summary": "Short high-level summary aligned with the selected architecture style.",
  "mermaidSource": "flowchart TD\\n  App[\\"App\\"] --> UI[\\"UI\\"]\\n  App --> Services[\\"Services\\"]",
  "notes": "Optional notes about runtime, data layer, or integrations.",
  "detailSections": [
    {
      "title": "Important directories",
      "content": "Describe major directories for the selected architecture style."
    },
    {
      "title": "Validation workflow",
      "content": "Document test, lint, typecheck, and migration commands."
    }
  ]
}

- Match architecture style: ${architectureLabel}.
- \`mermaidSource\` must use Mermaid \`flowchart TD\`.
- Include frontend, backend/API, database/data, and local tooling layers when applicable to the stack.
- Do not invent services that contradict the chosen stack.

## .mandev/onboarding.md

Write a concise onboarding guide covering:

- project purpose (${projectTypeLabel})
- chosen stack (${stackLabel})
- architecture style (${architectureLabel})
- how to run dev/test/lint commands
- where ManDev metadata lives
- next steps after initialization

## README.md

Create a concise README with:

- project name and purpose
- selected stack (${stackLabel})
- architecture style (${architectureLabel})
- setup instructions (placeholder steps are fine for an empty folder)
- run commands from run profiles
- validation commands
- note that \`.mandev/\` contains ManDev import metadata

## RESULT.md

Create:

# Project Initialization Result

## Summary

Initialized project blueprint using ManDev.

## Selected blueprint

- Project type: ${projectTypeLabel}
- Stack profile: ${stackLabel}
- Architecture style: ${architectureLabel}
- Rule packs: ${rulePacksForResult}

## Files created

- \`.mandev/project.json\`
- \`.mandev/run-profiles.json\`
- \`.mandev/architecture.json\`
- \`.mandev/blueprint.json\`
- \`.mandev/onboarding.md\`
- \`.cursor/rules/...\`
- \`README.md\`
- \`RESULT.md\`

## Next steps

1. Review generated metadata.
2. Adjust rules and architecture if needed.
3. Return to ManDev.
4. Click **Detect from local path**.
5. Create project.

After writing all files, validate that each JSON file is valid and show the final contents.

Then return to ManDev → New Project, enter the local path, and click **Detect from local path** to import the metadata.
`;
}
