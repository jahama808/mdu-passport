import { requireUser } from "@/lib/auth";
import PropertyForm from "@/components/property-form";

export default async function NewPropertyPage() {
  await requireUser();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">New property</h1>
      <PropertyForm />
    </div>
  );
}
