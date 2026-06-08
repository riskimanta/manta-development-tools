export const WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH = 180;

export function buildWorkProgressSessionSummaryPreview(
  markdown: string | null | undefined,
): string {
  if (markdown == null) {
    return "";
  }

  const normalized = markdown.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }

  if (normalized.length <= WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH)}…`;
}
