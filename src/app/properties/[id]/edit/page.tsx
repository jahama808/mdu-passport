import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProperty } from "@/lib/data";
import PropertyForm from "@/components/property-form";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Edit property</h1>
      <PropertyForm property={property} />
    </div>
  );
}
