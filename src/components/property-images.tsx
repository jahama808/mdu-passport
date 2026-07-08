"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Pencil, Trash2, Upload } from "lucide-react";
import { formatDate } from "@/lib/format";
import { MAX_IMAGE_BYTES } from "@/lib/images";
import type { PropertyImage } from "@/lib/types";
import {
  deletePropertyImage,
  updatePropertyImageNote,
  uploadPropertyImage,
} from "@/app/properties/[id]/images-actions";

export type PropertyImageWithUrl = PropertyImage & { url: string | null };

export default function PropertyImages({
  propertyId,
  images,
  canWrite,
}: {
  propertyId: string;
  images: PropertyImageWithUrl[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, startUpload] = useTransition();

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Choose a file first");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("File is too large (max 15 MB)");
      return;
    }
    startUpload(async () => {
      try {
        await uploadPropertyImage(propertyId, formData);
        formRef.current?.reset();
        toast.success("Image uploaded");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      {canWrite ? (
        <form ref={formRef} onSubmit={handleUpload} className="space-y-2">
          <Input
            type="file"
            name="file"
            accept="image/jpeg,image/png,application/pdf"
            disabled={uploading}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Input
              name="note"
              placeholder="Note (optional)"
              disabled={uploading}
              className="text-xs"
            />
            <Button type="submit" size="sm" disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-24">Added</TableHead>
              {canWrite ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.map((img) => (
              <ImageRow
                key={img.id}
                propertyId={propertyId}
                image={img}
                canWrite={canWrite}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ImageRow({
  propertyId,
  image,
  canWrite,
}: {
  propertyId: string;
  image: PropertyImageWithUrl;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete ${image.filename}?`)) return;
    startTransition(async () => {
      try {
        await deletePropertyImage(propertyId, image.id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const isPdf = image.content_type === "application/pdf";
  const thumbnail = isPdf || !image.url ? (
    <div className="h-14 w-14 rounded-md border bg-muted flex items-center justify-center">
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
  ) : (
    <Image
      src={image.url}
      alt={image.note ?? image.filename}
      width={112}
      height={112}
      unoptimized
      className="h-14 w-14 rounded-md border object-cover"
    />
  );

  return (
    <TableRow className={pending ? "opacity-50" : undefined}>
      <TableCell>
        {image.url ? (
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${image.filename} full size`}
          >
            {thumbnail}
          </a>
        ) : (
          thumbnail
        )}
      </TableCell>
      <TableCell className="whitespace-normal align-middle">
        <EditableImageNote
          propertyId={propertyId}
          imageId={image.id}
          initial={image.note}
          canWrite={canWrite}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(image.created_at)}
      </TableCell>
      {canWrite ? (
        <TableCell>
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={pending}
            aria-label={`Delete ${image.filename}`}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TableCell>
      ) : null}
    </TableRow>
  );
}

function EditableImageNote({
  propertyId,
  imageId,
  initial,
  canWrite,
}: {
  propertyId: string;
  imageId: string;
  initial: string | null;
  canWrite: boolean;
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
        await updatePropertyImageNote(propertyId, imageId, value);
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
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
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          disabled={pending}
          placeholder="Describe this image…"
          className="text-xs"
        />
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue(initial ?? "");
              setEditing(false);
            }}
            disabled={pending}
          >
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
    <button type="button" onClick={() => setEditing(true)} className="group w-full text-left">
      {initial ? (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap group-hover:text-foreground">
          {initial}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground/60 italic inline-flex items-center gap-1 group-hover:text-foreground">
          <Pencil className="h-3 w-3" /> Add note
        </span>
      )}
    </button>
  );
}
