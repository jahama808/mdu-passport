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

export function projectStatusColor(status: string): string {
  if (status === "open") {
    return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300";
  }
  return statusColor(status);
}

export function projectPriorityColor(priority: number): string {
  if (priority <= 3) {
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300";
  }
  if (priority <= 6) {
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300";
}

export function isOverdue(
  dueDate: string | null | undefined,
  status: string,
): boolean {
  if (!dueDate || status === "completed") return false;
  const due = new Date(`${dueDate}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due < new Date();
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

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length !== 10) return value;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

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
