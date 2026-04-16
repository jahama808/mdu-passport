"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { importPassport } from "@/app/properties/[id]/passport/actions";

export default function PassportImport({
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
    const text = await file.text();
    startTransition(async () => {
      try {
        await importPassport(propertyId, { filename: file.name, markdown: text });
        toast.success("Passport imported");
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
        accept=".md,text/markdown,text/plain"
        className="hidden"
        onChange={onFile}
        disabled={pending}
      />
      <span className="cursor-pointer inline-flex">{children}</span>
    </label>
  );
}
