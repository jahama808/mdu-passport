"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { ProjectNote } from "@/lib/types";
import {
  addProjectNote,
  deleteProjectNote,
} from "@/app/properties/[id]/projects/actions";

export default function ProjectNotes({
  propertyId,
  projectId,
  notes,
  canWrite = true,
}: {
  propertyId: string;
  projectId: string;
  notes: ProjectNote[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      try {
        await addProjectNote(propertyId, projectId, content);
        setContent("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Add failed");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      try {
        await deleteProjectNote(propertyId, projectId, id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {canWrite ? (
        <form onSubmit={submit} className="space-y-2">
          <Textarea
            rows={3}
            placeholder="Add a working note for this project…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !content.trim()}>
              {pending ? "Adding…" : "Add note"}
            </Button>
          </div>
        </form>
      ) : null}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-center text-muted-foreground">
            No notes yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Card key={n.id}>
              <CardContent className="py-3 flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">
                    {formatDateTime(n.created_at)}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                </div>
                {canWrite ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(n.id)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
