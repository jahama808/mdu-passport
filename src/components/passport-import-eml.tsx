"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { importPassportEml } from "@/app/properties/[id]/passport/actions";

export default function PassportImportEml({
  propertyId,
  children,
}: {
  propertyId: string;
  children: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    startTransition(async () => {
      try {
        const result = await importPassportEml(propertyId, {
          filename: file.name,
          raw,
        });
        const filled = result.filledFields.length;
        const skipped = result.skippedFields.length;
        const parts = [`Imported ${file.name}`];
        if (filled > 0) parts.push(`filled ${filled} field${filled === 1 ? "" : "s"}`);
        if (skipped > 0) {
          parts.push(`kept existing ${skipped} field${skipped === 1 ? "" : "s"}`);
        }
        toast.success(parts.join(" · "));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <label className="inline-flex">
      <input
        ref={inputRef}
        type="file"
        accept=".eml,message/rfc822"
        className="hidden"
        onChange={onFile}
        disabled={pending}
      />
      <span className="cursor-pointer inline-flex">{children}</span>
    </label>
  );
}
