"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExportProjectsButton() {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    const toastId = toast.loading(
      "Generating Excel report — summarizing recent notes…",
    );
    try {
      const res = await fetch("/api/projects/export");
      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? "active-projects.xlsx";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Excel report downloaded", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed", {
        id: toastId,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={busy}>
      {busy ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      {busy ? "Generating…" : "Export Excel"}
    </Button>
  );
}
