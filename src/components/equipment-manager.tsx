"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { upsertEquipmentType, deleteEquipmentType } from "@/app/equipment/actions";
import type { EquipmentType } from "@/lib/types";

const CATEGORIES = [
  "ap",
  "switch",
  "router",
  "ont",
  "cable",
  "mount",
  "rack",
  "ups",
  "other",
];

export default function EquipmentManager({ items }: { items: EquipmentType[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New equipment type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <EquipmentForm
              equipment={editing ?? undefined}
              onDone={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment types</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No equipment yet. Add reusable types like &quot;Cisco Catalyst 9300&quot; or
              &quot;UniFi U7 Pro&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.category ?? "—"}</TableCell>
                    <TableCell>{e.manufacturer ?? "—"}</TableCell>
                    <TableCell>{e.model ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        item={e}
                        onEdit={() => {
                          setEditing(e);
                          setOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RowActions({
  item,
  onEdit,
}: {
  item: EquipmentType;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${item.name}"?`)) return;
          startTransition(async () => {
            try {
              await deleteEquipmentType(item.id);
              toast.success("Deleted");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Delete failed");
            }
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EquipmentForm({
  equipment,
  onDone,
}: {
  equipment?: EquipmentType;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: equipment?.name ?? "",
    category: equipment?.category ?? "",
    manufacturer: equipment?.manufacturer ?? "",
    model: equipment?.model ?? "",
    description: equipment?.description ?? "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertEquipmentType({ id: equipment?.id, ...form });
        toast.success(equipment ? "Updated" : "Created");
        onDone();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{equipment ? "Edit equipment" : "New equipment type"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              list="equipment-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="ap, switch, router…"
            />
            <datalist id="equipment-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Manufacturer</Label>
            <Input
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Model</Label>
          <Input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : equipment ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
