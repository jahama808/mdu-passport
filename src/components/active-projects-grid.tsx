"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ProjectPrioritySelect from "@/components/project-priority-select";
import {
  titleCase,
  formatDate,
  projectStatusColor,
  projectPriorityColor,
  isOverdue,
  isStaleUpdate,
  islandAccentStyle,
  ISLAND_LABEL,
} from "@/lib/format";
import { ISLANDS } from "@/lib/types";
import type { ProjectWithProperty } from "@/lib/data";

type SortKey = "priority" | "property" | "updated" | "due" | "status";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "property", label: "Property Name" },
  { value: "updated", label: "Last Update" },
  { value: "due", label: "Expected Finish Date" },
  { value: "status", label: "Status (Open/In Progress)" },
];

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  in_progress: 1,
  completed: 2,
};

function compareDueDate(a: ProjectWithProperty, b: ProjectWithProperty) {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return 0;
}

function compareProjects(
  a: ProjectWithProperty,
  b: ProjectWithProperty,
  sortBy: SortKey,
) {
  let primary = 0;
  switch (sortBy) {
    case "property":
      primary = (a.property?.name ?? "").localeCompare(b.property?.name ?? "");
      break;
    case "priority":
      primary = a.priority - b.priority;
      break;
    case "updated":
      // most recently updated first
      primary = b.updated_at.localeCompare(a.updated_at);
      break;
    case "due":
      primary = compareDueDate(a, b);
      break;
    case "status":
      primary = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      break;
  }
  if (primary !== 0) return primary;
  // stable tiebreakers, same as the default priority sort
  if (a.priority !== b.priority) return a.priority - b.priority;
  const due = compareDueDate(a, b);
  if (due !== 0) return due;
  return a.created_at < b.created_at ? 1 : -1;
}

export default function ActiveProjectsGrid({
  projects,
  canWrite,
}: {
  projects: ProjectWithProperty[];
  canWrite: boolean;
}) {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [islandFilter, setIslandFilter] = useState<string>("all");

  const sorted = useMemo(() => {
    return projects
      .map((p) =>
        overrides[p.id] != null ? { ...p, priority: overrides[p.id] } : p,
      )
      .filter(
        (p) => islandFilter === "all" || p.property?.island === islandFilter,
      )
      .toSorted((a, b) => compareProjects(a, b, sortBy));
  }, [projects, overrides, sortBy, islandFilter]);

  function setPriority(id: string, priority: number) {
    setOverrides((prev) => ({ ...prev, [id]: priority }));
  }

  function clearPriority(id: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="projects-sort-by" className="text-xs text-muted-foreground">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger id="projects-sort-by" size="sm" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="projects-island-filter" className="text-xs text-muted-foreground">
            Island
          </Label>
          <Select value={islandFilter} onValueChange={setIslandFilter}>
            <SelectTrigger id="projects-island-filter" size="sm" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All islands</SelectItem>
              {ISLANDS.map((island) => (
                <SelectItem key={island} value={island}>
                  {ISLAND_LABEL[island]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects match this filter.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => {
            const overdue = isOverdue(p.due_date, p.status);
            const staleUpdate = isStaleUpdate(p.updated_at);
            return (
              <Card
                key={p.id}
                className="relative h-full hover:border-foreground/20 border-l-4"
                style={{
                  ...islandAccentStyle(p.property?.island ?? null),
                  borderLeftColor: "var(--island-accent)",
                }}
              >
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/properties/${p.property_id}/projects/${p.id}`}
                      className="font-medium text-sm leading-snug after:absolute after:inset-0"
                    >
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                      {canWrite ? (
                        <ProjectPrioritySelect
                          propertyId={p.property_id}
                          projectId={p.id}
                          priority={p.priority}
                          onOptimistic={(next) => setPriority(p.id, next)}
                          onError={() => clearPriority(p.id)}
                        />
                      ) : (
                        <span
                          className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${projectPriorityColor(
                            p.priority,
                          )}`}
                        >
                          P{p.priority}
                        </span>
                      )}
                      <span
                        className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${projectStatusColor(
                          p.status,
                        )}`}
                      >
                        {titleCase(p.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {p.property?.name ?? "Unknown property"}
                    </Badge>
                    {p.property?.island ? (
                      <Badge variant="secondary" className="text-xs">
                        {titleCase(p.property.island)}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        staleUpdate
                          ? "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 font-medium"
                          : ""
                      }`}
                    >
                      Updated {formatDate(p.updated_at)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.due_date ? (
                      <span
                        className={
                          overdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : ""
                        }
                      >
                        Expected finish {formatDate(p.due_date)}
                        {overdue ? " · overdue" : ""}
                      </span>
                    ) : (
                      "No expected finish date"
                    )}
                  </div>
                  {p.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
