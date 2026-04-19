import type { Island } from "./types";
import type React from "react";

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

const ISLAND_ACCENT: Record<Island, string> = {
  "kauai":      "var(--island-kauai)",
  "oahu":       "var(--island-oahu)",
  "molokai":    "var(--island-molokai)",
  "lanai":      "var(--island-lanai)",
  "maui":       "var(--island-maui)",
  "big-island": "var(--island-big-island)",
};

export function islandAccent(island: Island | null | undefined): string {
  if (!island) return "var(--border)";
  return ISLAND_ACCENT[island] ?? "var(--border)";
}

export function islandAccentStyle(
  island: Island | null | undefined,
): React.CSSProperties {
  return { ["--island-accent" as string]: islandAccent(island) } as React.CSSProperties;
}

export const ISLAND_LABEL: Record<Island, string> = {
  "kauai":      "Kauaʻi",
  "oahu":       "Oʻahu",
  "molokai":    "Molokaʻi",
  "lanai":      "Lānaʻi",
  "maui":       "Maui",
  "big-island": "Hawaiʻi",
};

export function overallStatus(summary: {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
}): "completed" | "in_progress" | "not_started" | "mixed" {
  if (summary.total === 0) return "not_started";
  if (summary.completed === summary.total) return "completed";
  if (summary.not_started === summary.total) return "not_started";
  if (summary.in_progress > 0) return "in_progress";
  return "mixed";
}
