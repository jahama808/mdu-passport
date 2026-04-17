import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listProperties } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardPropertyGrid from "@/components/dashboard-property-grid";

export default async function DashboardPage() {
  await requireUser();
  const properties = await listProperties();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} properties
          </p>
        </div>
        <Link href="/properties/new">
          <Button className="btn-gradient">
            <Plus className="h-4 w-4 mr-2" /> New property
          </Button>
        </Link>
      </div>

      <DashboardPropertyGrid properties={properties} />
    </div>
  );
}
