/** Default collapsed summary height in the architecture card (line-clamp). */
export const ARCHITECTURE_SUMMARY_MAX_LINES = 4;

/** Approximate characters per wrapped line for single-paragraph summaries. */
const CHARS_PER_LINE_ESTIMATE = 72;

export function isArchitectureSummaryLong(
  summary: string,
  maxLines = ARCHITECTURE_SUMMARY_MAX_LINES,
): boolean {
  const trimmed = summary.trim();
  if (!trimmed) {
    return false;
  }

  const explicitLines = trimmed.split(/\n/);
  if (explicitLines.length > maxLines) {
    return true;
  }

  const estimatedLines = Math.ceil(trimmed.length / CHARS_PER_LINE_ESTIMATE);
  return estimatedLines > maxLines;
}
