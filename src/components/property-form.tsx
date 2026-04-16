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
  PROPERTY_TYPES,
  ISLANDS,
  type Property,
  type PropertyType,
  type Island,
} from "@/lib/types";
import { titleCase } from "@/lib/format";
import { upsertProperty } from "@/app/properties/actions";

export default function PropertyForm({ property }: { property?: Property }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: property?.name ?? "",
    slug: property?.slug ?? "",
    type: property?.type ?? "mdu",
    address: property?.address ?? "",
    island: property?.island ?? "oahu",
    gm_name: property?.gm_name ?? "",
    gm_email: property?.gm_email ?? "",
    notes: property?.notes ?? "",
  });

  function onChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const { id } = await upsertProperty({
          id: property?.id,
          ...form,
        });
        toast.success(property ? "Property updated" : "Property created");
        router.push(`/properties/${id}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input
            required
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </Field>
        <Field label="Slug" hint="Auto-generated if blank">
          <Input
            value={form.slug}
            onChange={(e) => onChange("slug", e.target.value)}
          />
        </Field>
        <Field label="Type">
          <Select
            value={form.type}
            onValueChange={(v) => onChange("type", v as PropertyType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {titleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Island">
          <Select
            value={form.island}
            onValueChange={(v) => onChange("island", v as Island)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISLANDS.map((i) => (
                <SelectItem key={i} value={i}>
                  {titleCase(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Address">
        <Input
          value={form.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GM name">
          <Input
            value={form.gm_name}
            onChange={(e) => onChange("gm_name", e.target.value)}
          />
        </Field>
        <Field label="GM email">
          <Input
            type="email"
            value={form.gm_email}
            onChange={(e) => onChange("gm_email", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea
          rows={4}
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : property ? "Save changes" : "Create property"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
