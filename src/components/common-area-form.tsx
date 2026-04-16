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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import {
  AREA_TYPES,
  INSTALL_STATUSES,
  type AreaType,
  type InstallStatus,
  type CommonArea,
  type CommonAreaEquipment,
  type EquipmentType,
} from "@/lib/types";
import { titleCase } from "@/lib/format";
import {
  saveCommonArea,
  deleteCommonArea,
  type EquipmentRow,
} from "@/app/properties/[id]/common-areas/actions";

type Props = {
  propertyId: string;
  area?: CommonArea;
  equipmentRows?: CommonAreaEquipment[];
  equipmentTypes: EquipmentType[];
};

export default function CommonAreaForm({
  propertyId,
  area,
  equipmentRows = [],
  equipmentTypes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    area_type: area?.area_type ?? "lobby",
    area_name: area?.area_name ?? "",
    description: area?.description ?? "",
    notes: area?.notes ?? "",
    installation_status: area?.installation_status ?? "not_started",
    priority: area?.priority ?? 3,
    installation_date: area?.installation_date ?? "",
  });

  const [rows, setRows] = useState<EquipmentRow[]>(() =>
    equipmentRows.map((r) => ({
      id: r.id,
      equipment_type_id: r.equipment_type_id,
      quantity: r.quantity,
      notes: r.notes ?? "",
    })),
  );

  function addRow() {
    setRows((r) => [
      ...r,
      { equipment_type_id: equipmentTypes[0]?.id ?? "", quantity: 1, notes: "" },
    ]);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, patch: Partial<EquipmentRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.area_name.trim()) {
      toast.error("Area name is required");
      return;
    }
    startTransition(async () => {
      try {
        const { id } = await saveCommonArea({
          id: area?.id,
          property_id: propertyId,
          area_type: form.area_type,
          area_name: form.area_name,
          description: form.description,
          notes: form.notes,
          installation_status: form.installation_status,
          priority: Number(form.priority),
          installation_date: form.installation_date || null,
          equipment: rows.filter((r) => r.equipment_type_id),
        });
        toast.success(area ? "Saved" : "Created");
        router.push(`/properties/${propertyId}/common-areas/${id}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function onDelete() {
    if (!area) return;
    if (!confirm(`Delete common area "${area.area_name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCommonArea(propertyId, area.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Area details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Area name *</Label>
              <Input
                required
                value={form.area_name}
                onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                placeholder="Main lobby"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.area_type}
                onValueChange={(v) =>
                  setForm({ ...form, area_type: v as AreaType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREA_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.installation_status}
                onValueChange={(v) =>
                  setForm({ ...form, installation_status: v as InstallStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Installation date</Label>
              <Input
                type="date"
                value={form.installation_date ?? ""}
                onChange={(e) =>
                  setForm({ ...form, installation_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Internal notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Equipment</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Add equipment
          </Button>
        </CardHeader>
        <CardContent>
          {equipmentTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No equipment types yet. Add some in the{" "}
              <a href="/equipment" className="underline">
                Equipment catalog
              </a>{" "}
              first.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No equipment assigned. Click &quot;Add equipment&quot; to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div
                  key={row.id ?? `new-${i}`}
                  className="grid grid-cols-[2fr_auto_2fr_auto] gap-2 items-end border rounded-md p-2"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Equipment</Label>
                    <Select
                      value={row.equipment_type_id}
                      onValueChange={(v) => updateRow(i, { equipment_type_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map((et) => (
                          <SelectItem key={et.id} value={et.id}>
                            {et.name}
                            {et.model ? ` — ${et.model}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-20">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(i, { quantity: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input
                      value={row.notes ?? ""}
                      onChange={(e) => updateRow(i, { notes: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : area ? "Save changes" : "Create area"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        {area ? (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
