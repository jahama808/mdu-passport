"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectPrioritySelect from "@/components/project-priority-select";
import {
  titleCase,
  formatDate,
  projectStatusColor,
  projectPriorityColor,
  isOverdue,
  islandAccentStyle,
} from "@/lib/format";
import type { ProjectWithProperty } from "@/lib/data";

function compareProjects(a: ProjectWithProperty, b: ProjectWithProperty) {
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
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

  const sorted = useMemo(() => {
    return projects
      .map((p) =>
        overrides[p.id] != null ? { ...p, priority: overrides[p.id] } : p,
      )
      .toSorted(compareProjects);
  }, [projects, overrides]);

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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((p) => {
        const overdue = isOverdue(p.due_date, p.status);
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
  );
}
