const ACRONYMS = new Set([
  "mdu",
  "gm",
  "ap",
  "ups",
  "ont",
  "nvr",
  "olt",
  "wifi",
  "poe",
  "sn",
  "mac",
  "mrc",
  "po",
  "id",
]);

export function titleCase(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300";
    case "not_started":
    default:
      return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300";
  }
}
