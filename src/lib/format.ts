export function formatRelativeTime(date: Date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function featureStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draft",
    ready: "Ready",
    in_progress: "In progress",
    done: "Done",
  };
  return map[status] ?? status;
}
