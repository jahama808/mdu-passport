"use client";

import type { Island } from "@/lib/types";
import { ISLANDS } from "@/lib/types";
import { ISLAND_LABEL, islandAccent } from "@/lib/format";

export function IslandFilter({
  value,
  onChange,
  counts,
}: {
  value: Island | null;
  onChange: (v: Island | null) => void;
  counts: Partial<Record<Island, number>>;
}) {
  const total = Object.values(counts).reduce<number>(
    (a, b) => a + (b || 0),
    0,
  );
  return (
    <div className="flex gap-1 flex-wrap flex-1">
      <button
        type="button"
        className={`if-btn ${value === null ? "selected" : ""}`}
        onClick={() => onChange(null)}
      >
        All <span className="if-count">{total}</span>
      </button>
      {ISLANDS.map((i) => (
        <button
          type="button"
          key={i}
          className={`if-btn ${value === i ? "selected" : ""}`}
          style={
            value === i
              ? ({ ["--island-accent" as string]: islandAccent(i) } as React.CSSProperties)
              : undefined
          }
          disabled={!counts[i]}
          onClick={() => onChange(i)}
        >
          {ISLAND_LABEL[i]} <span className="if-count">{counts[i] || 0}</span>
        </button>
      ))}
    </div>
  );
}
