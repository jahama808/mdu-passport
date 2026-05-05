import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProperty } from "@/lib/data";
import { Button } from "@/components/ui/button";
import CommonAreasCsvUpload from "@/components/common-areas-csv-upload";

export default async function UploadCommonAreasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Batch upload common areas</h1>
          <p className="text-sm text-muted-foreground">{property.name}</p>
        </div>
        <Link href={`/properties/${id}`}>
          <Button variant="ghost" size="sm">
            Back to property
          </Button>
        </Link>
      </div>
      <CommonAreasCsvUpload propertyId={id} />
    </div>
  );
}
