"use client";

import { LayoutGrid, List } from "lucide-react";

export function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}) {
  return (
    <div className="view-toggle" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={value === "grid"}
        className={`vt-btn ${value === "grid" ? "selected" : ""}`}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Grid
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "list"}
        className={`vt-btn ${value === "list" ? "selected" : ""}`}
        onClick={() => onChange("list")}
      >
        <List className="h-3.5 w-3.5" /> List
      </button>
    </div>
  );
}
