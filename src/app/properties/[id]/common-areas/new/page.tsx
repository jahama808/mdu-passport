import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProperty, listEquipmentTypes } from "@/lib/data";
import CommonAreaForm from "@/components/common-area-form";

export default async function NewCommonAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [property, equipmentTypes] = await Promise.all([
    getProperty(id),
    listEquipmentTypes(),
  ]);
  if (!property) notFound();
  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New common area</h1>
        <p className="text-sm text-muted-foreground">{property.name}</p>
      </div>
      <CommonAreaForm propertyId={id} equipmentTypes={equipmentTypes} />
    </div>
  );
}
