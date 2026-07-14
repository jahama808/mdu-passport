"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_PRIORITIES } from "@/lib/types";
import { projectPriorityColor } from "@/lib/format";
import { updateProjectPriority } from "@/app/properties/[id]/projects/actions";

export default function ProjectPrioritySelect({
  propertyId,
  projectId,
  priority,
  onOptimistic,
  onError,
}: {
  propertyId: string;
  projectId: string;
  priority: number;
  onOptimistic?: (next: number) => void;
  onError?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const value = Number(next);
    if (value === priority) return;
    onOptimistic?.(value);
    startTransition(async () => {
      try {
        await updateProjectPriority(propertyId, projectId, value);
        router.refresh();
      } catch (err) {
        onError?.();
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <Select value={String(priority)} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        size="sm"
        className={`w-auto gap-1 px-2 text-xs font-medium ${projectPriorityColor(priority)}`}
        aria-label="Priority"
      >
        <SelectValue>{`P${priority}`}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {PROJECT_PRIORITIES.map((p) => (
          <SelectItem key={p} value={String(p)}>
            P{p}
            {p === 1 ? " · highest" : p === 10 ? " · lowest" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
