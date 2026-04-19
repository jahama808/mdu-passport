"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  titleCase,
  islandAccentStyle,
  ISLAND_LABEL,
  overallStatus,
} from "@/lib/format";
import PropertyCardBody from "@/components/property-card-body";
import { IslandFilter } from "@/components/island-filter";
import { ViewToggle } from "@/components/view-toggle";
import type { Property, Island } from "@/lib/types";

type StatusSummary = {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
};

type Props = {
  properties: Property[];
  summaries?: Record<string, StatusSummary>;
};

export default function DashboardPropertyGrid({
  properties,
  summaries = {},
}: Props) {
  const [query, setQuery] = useState("");
  const [island, setIsland] = useState<Island | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const counts = useMemo(() => {
    const c: Partial<Record<Island, number>> = {};
    properties.forEach((p) => {
      if (!p.island) return;
      c[p.island] = (c[p.island] || 0) + 1;
    });
    return c;
  }, [properties]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((p) => {
      if (island && p.island !== island) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [properties, query, island]);

  return (
    <>
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by property name…"
            className="pl-9"
          />
        </div>
        <IslandFilter value={island} onChange={setIsland} counts={counts} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {query || island
              ? "No properties match your filters."
              : "No properties yet."}
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const summary = summaries[p.id];
            return (
              <Link key={p.id} href={`/properties/${p.id}`}>
                <Card
                  className="property-card h-full"
                  style={islandAccentStyle(p.island)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{p.name}</span>
                      <Badge variant="outline" className="shrink-0 ml-2">
                        {titleCase(p.type)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <PropertyCardBody property={p} />
                    {summary && summary.total > 0 ? (
                      <ProgressRail s={summary} />
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="list-wrap">
          <div className="list-head">
            <div />
            <div>Property</div>
            <div>Island</div>
            <div>Type</div>
            <div>Units</div>
            <div>GM</div>
            <div>Completion</div>
            <div>Status</div>
          </div>
          {filtered.map((p) => {
            const summary = summaries[p.id];
            const status = summary ? overallStatus(summary) : "not_started";
            const pct = summary
              ? Math.round((summary.completed / Math.max(summary.total, 1)) * 100)
              : 0;
            return (
              <Link key={p.id} href={`/properties/${p.id}`}>
                <div className="list-row" style={islandAccentStyle(p.island)}>
                  <div className="lr-rail" />
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p.details?.service_type, p.details?.plan_speed]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="text-xs">
                    {p.island ? ISLAND_LABEL[p.island] : "—"}
                  </div>
                  <div className="text-xs uppercase">{p.type}</div>
                  <div className="text-xs font-mono">
                    {p.details?.billable_units || "—"}
                  </div>
                  <div className="text-xs truncate">{p.gm_name || "—"}</div>
                  <div className="lr-progress">
                    <div className="lr-progress-bar">
                      <div
                        className="lr-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">
                      {summary
                        ? `${summary.completed}/${summary.total}`
                        : "—"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {titleCase(status)}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProgressRail({ s }: { s: StatusSummary }) {
  const total = Math.max(s.total, 1);
  const c = (s.completed / total) * 100;
  const a = (s.in_progress / total) * 100;
  return (
    <div className="progress-rail">
      <div className="progress-track" />
      <div className="progress-fill ok" style={{ width: `${c}%` }} />
      <div
        className="progress-fill active"
        style={{ width: `${a}%`, left: `${c}%` }}
      />
      <div className="progress-labels">
        <span>
          {s.completed}/{s.total} areas
        </span>
        {s.in_progress > 0 && <span>· {s.in_progress} active</span>}
      </div>
    </div>
  );
}
