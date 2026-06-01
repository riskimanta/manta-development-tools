import { featureStatusLabel } from "@/lib/format";

export type FeatureCursorPromptInput = {
  project: {
    name: string;
    slug: string;
    repoUrl: string | null;
    localPath: string | null;
  };
  feature: {
    title: string;
    status: string;
    priority: number | null;
    description: string | null;
  };
};

export function buildFeatureCursorPrompt(input: FeatureCursorPromptInput): string {
  const { project, feature } = input;
  const priorityText =
    feature.priority != null ? String(feature.priority) : "Not set";
  const descriptionText = feature.description?.trim()
    ? feature.description.trim()
    : "No description provided. Infer carefully from the feature title and existing codebase.";

  return `You are working on the ManDev project: ${project.name}.

Project context:

* Project slug: ${project.slug}
* Repository URL: ${project.repoUrl ?? "Not provided"}
* Local path: ${project.localPath ?? "Not provided"}

Feature to implement:

* Title: ${feature.title}
* Status: ${featureStatusLabel(feature.status)}
* Priority: ${priorityText}

Feature description:
${descriptionText}

Implementation instructions:

1. Inspect the relevant files before coding.
2. Keep the change narrowly scoped to this feature.
3. Do not refactor unrelated code.
4. Follow the existing architecture and UI patterns.
5. Update or create documentation if behavior changes.
6. Update RESULT.md with:

   * What changed
   * Files edited
   * How to test/use the feature
   * Any limitations or follow-up recommendations
7. Run:

   * pnpm typecheck
   * pnpm lint
`;
}
