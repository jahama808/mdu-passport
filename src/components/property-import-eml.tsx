"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importEmlAndRouteToProperty } from "@/app/properties/actions";

type Progress = { current: number; total: number };

export default function PropertyImportEml() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<Progress | null>(null);
  const router = useRouter();

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    startTransition(async () => {
      const results: {
        filename: string;
        matched?: boolean;
        propertyId?: string;
        propertyName?: string;
        error?: string;
      }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
        try {
          const raw = await file.text();
          const r = await importEmlAndRouteToProperty({
            filename: file.name,
            raw,
          });
          results.push({
            filename: file.name,
            matched: r.matched,
            propertyId: r.propertyId,
            propertyName: r.propertyName,
          });
        } catch (err) {
          results.push({
            filename: file.name,
            error: err instanceof Error ? err.message : "Import failed",
          });
        }
      }

      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";

      const ok = results.filter((r) => !r.error);
      const matched = ok.filter((r) => r.matched).length;
      const created = ok.filter((r) => !r.matched).length;
      const failed = results.length - ok.length;

      if (results.length === 1 && ok.length === 1 && ok[0].propertyId) {
        toast.success(
          ok[0].matched
            ? `Matched existing property: ${ok[0].propertyName}`
            : `Created new property: ${ok[0].propertyName}`,
        );
        router.push(`/properties/${ok[0].propertyId}`);
        return;
      }

      const parts = [`Imported ${ok.length}/${results.length}`];
      if (matched) parts.push(`${matched} matched`);
      if (created) parts.push(`${created} created`);
      if (failed) parts.push(`${failed} failed`);
      (failed > 0 ? toast.error : toast.success)(parts.join(" · "));

      if (failed > 0) {
        for (const r of results.filter((r) => r.error)) {
          console.error(`${r.filename}: ${r.error}`);
        }
      }

      router.refresh();
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".eml,message/rfc822"
        multiple
        className="hidden"
        onChange={onFiles}
        disabled={pending}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {progress
              ? `Processing ${progress.current}/${progress.total}…`
              : "Processing…"}
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" /> Import .eml
          </>
        )}
      </Button>
    </>
  );
}
