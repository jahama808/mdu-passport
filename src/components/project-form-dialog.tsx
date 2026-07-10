"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  PROJECT_STATUSES,
  type ProjectStatus,
  type PropertyProject,
} from "@/lib/types";
import { titleCase } from "@/lib/format";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/app/properties/[id]/projects/actions";

export default function ProjectFormDialog({
  propertyId,
  project,
}: {
  propertyId: string;
  project?: PropertyProject;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: project?.title ?? "",
    description: project?.description ?? "",
    status: (project?.status ?? "open") as ProjectStatus,
    due_date: project?.due_date ?? "",
  });

  function resetForm() {
    setForm({
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "open",
      due_date: project?.due_date ?? "",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Project title is required");
      return;
    }
    startTransition(async () => {
      try {
        const input = {
          title: form.title,
          description: form.description || null,
          status: form.status,
          due_date: form.due_date || null,
        };
        if (project) {
          await updateProject(propertyId, project.id, input);
          toast.success("Project saved");
        } else {
          await createProject(propertyId, input);
          toast.success("Project created");
        }
        setOpen(false);
        if (!project) resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function onDelete() {
    if (!project) return;
    if (!confirm(`Delete project "${project.title}" and all its notes?`)) return;
    startTransition(async () => {
      try {
        await deleteProject(propertyId, project.id);
        setOpen(false);
        router.push(`/properties/${propertyId}/projects`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {project ? (
          <Button size="sm" variant="outline">
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Fitness machine video install"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Scope, contacts, gear needed…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as ProjectStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expected finish</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {project ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
