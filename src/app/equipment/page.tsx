import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { listEquipmentTypes } from "@/lib/data";
import EquipmentManager from "@/components/equipment-manager";

export default async function EquipmentPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const items = await listEquipmentTypes();
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Equipment catalog</h1>
        <p className="text-sm text-muted-foreground">
          Reusable equipment types for common area installations.
        </p>
      </div>
      <EquipmentManager items={items} canWrite={canWrite} />
    </div>
  );
}
