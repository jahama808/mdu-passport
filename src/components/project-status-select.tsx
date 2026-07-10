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
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { updateProjectStatus } from "@/app/properties/[id]/projects/actions";

export default function ProjectStatusSelect({
  propertyId,
  projectId,
  status,
}: {
  propertyId: string;
  projectId: string;
  status: ProjectStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(async () => {
      try {
        await updateProjectStatus(propertyId, projectId, next as ProjectStatus);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-40" size="sm">
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
  );
}
