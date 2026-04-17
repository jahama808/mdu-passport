"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { updateScanNarration } from "@/app/properties/[id]/scans/actions";

export default function EditableNarration({
  propertyId,
  scanId,
  initial,
  canWrite = true,
}: {
  propertyId: string;
  scanId: string;
  initial: string | null;
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if ((value.trim() || null) === (initial ?? null)) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        await updateScanNarration(propertyId, scanId, value);
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function cancel() {
    setValue(initial ?? "");
    setEditing(false);
  }

  if (!canWrite) {
    return initial ? (
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{initial}</p>
    ) : null;
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          disabled={pending}
          placeholder="Describe what's in this photo…"
          className="text-xs"
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={cancel} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group w-full text-left"
    >
      {initial ? (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap group-hover:text-foreground">
          {initial}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground/60 italic inline-flex items-center gap-1 group-hover:text-foreground">
          <Pencil className="h-3 w-3" /> Add notes
        </span>
      )}
    </button>
  );
}
