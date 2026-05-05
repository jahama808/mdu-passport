"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload } from "lucide-react";
import { batchUpsertCommonAreasFromCsv } from "@/app/properties/[id]/common-areas/actions";

type ParsedRow = {
  rowNum: number;
  area_name: string;
  sublocation: string;
  btn: string;
  error?: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        cur.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\r") {
        i++;
        continue;
      }
      if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
        i++;
        continue;
      }
      field += c;
      i++;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function formatBtnDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 10) return raw;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function CommonAreasCsvUpload({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  function reset() {
    setRows(null);
    setFileName("");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const grid = parseCsv(text);
    if (grid.length === 0) {
      toast.error("CSV is empty");
      return;
    }
    const dataRows = grid.slice(1);
    const parsed: ParsedRow[] = dataRows.map((cells, idx) => {
      const [device, sub, btn] = cells;
      const name = (device ?? "").trim().toUpperCase();
      const btnDigits = (btn ?? "").replace(/\D/g, "");
      let error: string | undefined;
      if (!name) error = "Device Name is empty";
      else if (btnDigits && btnDigits.length !== 10)
        error = "BTN must be exactly 10 digits";
      return {
        rowNum: idx + 2,
        area_name: name,
        sublocation: (sub ?? "").trim(),
        btn: (btn ?? "").trim(),
        error,
      };
    });
    setRows(parsed);
    e.target.value = "";
  }

  function submit() {
    if (!rows) return;
    const valid = rows
      .filter((r) => !r.error)
      .map((r) => ({
        rowNum: r.rowNum,
        area_name: r.area_name,
        sublocation: r.sublocation,
        btn: r.btn,
      }));
    if (valid.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }
    startTransition(async () => {
      try {
        const result = await batchUpsertCommonAreasFromCsv(propertyId, valid);
        const summary =
          `Created ${result.created}, updated ${result.updated}` +
          (result.errors.length ? `, ${result.errors.length} errors` : "");
        if (result.errors.length === 0) {
          toast.success(summary);
          router.push(`/properties/${propertyId}`);
          router.refresh();
        } else {
          toast.warning(summary);
          setRows(
            (prev) =>
              prev?.map((r) => {
                const e = result.errors.find((er) => er.rowNum === r.rowNum);
                return e ? { ...r, error: e.message } : r;
              }) ?? null,
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  const validCount = rows?.filter((r) => !r.error).length ?? 0;
  const errorCount = rows?.filter((r) => r.error).length ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Upload a .csv with three columns:{" "}
            <code className="text-foreground">Device Name</code>,{" "}
            <code className="text-foreground">Sublocation</code>,{" "}
            <code className="text-foreground">BTN</code>. The first row is
            treated as the header and skipped.
          </p>
          <p>
            Device Names are normalized to ALL CAPS. Rows that match an
            existing common area (case-insensitive by Device Name) will have
            their Sublocation and BTN updated. Unmatched rows are created as
            new common areas with type &quot;Other&quot; and status &quot;Not
            started&quot; — you can edit them afterward.
          </p>
          <p>BTN must be exactly 10 digits (formatting like dashes is OK).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="csv-file">CSV file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              disabled={pending}
            />
            {fileName ? (
              <p className="text-xs text-muted-foreground">{fileName}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {rows ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Preview — {validCount} valid
              {errorCount > 0 ? `, ${errorCount} with errors` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium w-12">#</th>
                    <th className="px-3 py-2 font-medium">Device Name</th>
                    <th className="px-3 py-2 font-medium">Sublocation</th>
                    <th className="px-3 py-2 font-medium">BTN</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.rowNum}
                      className={`border-t ${r.error ? "bg-destructive/5" : ""}`}
                    >
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {r.rowNum}
                      </td>
                      <td className="px-3 py-1.5">{r.area_name || "—"}</td>
                      <td className="px-3 py-1.5">{r.sublocation || "—"}</td>
                      <td className="px-3 py-1.5">
                        {r.btn ? formatBtnDisplay(r.btn) : "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        {r.error ? (
                          <span className="text-destructive text-xs">
                            {r.error}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={submit}
                disabled={pending || validCount === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                {pending
                  ? "Uploading…"
                  : `Upload ${validCount} row${validCount === 1 ? "" : "s"}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={pending}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
