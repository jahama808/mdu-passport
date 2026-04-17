import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import {
  getCommonArea,
  getProperty,
  listCommonAreaEquipment,
  listEquipmentTypes,
} from "@/lib/data";
import CommonAreaForm from "@/components/common-area-form";

export default async function CommonAreaDetailPage({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>;
}) {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const { id, areaId } = await params;
  const [property, area, equipmentRows, equipmentTypes] = await Promise.all([
    getProperty(id),
    getCommonArea(areaId),
    listCommonAreaEquipment(areaId),
    listEquipmentTypes(),
  ]);
  if (!property || !area || area.property_id !== id) notFound();
  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{area.area_name}</h1>
        <p className="text-sm text-muted-foreground">{property.name}</p>
      </div>
      <CommonAreaForm
        propertyId={id}
        area={area}
        equipmentRows={equipmentRows}
        equipmentTypes={equipmentTypes}
        canWrite={canWrite}
      />
    </div>
  );
}
