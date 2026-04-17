"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importEmlAndRouteToProperty } from "@/app/properties/actions";

export default function PropertyImportEml() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    startTransition(async () => {
      try {
        const result = await importEmlAndRouteToProperty({
          filename: file.name,
          raw,
        });
        toast.success(
          result.matched
            ? `Matched existing property: ${result.propertyName}`
            : `Created new property: ${result.propertyName}`,
        );
        router.push(`/properties/${result.propertyId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".eml,message/rfc822"
        className="hidden"
        onChange={onFile}
        disabled={pending}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
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
