import Link from "next/link";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listProperties } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardPropertyGrid from "@/components/dashboard-property-grid";

export default async function DashboardPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
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
        {canWrite ? (
          <Link href="/properties/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" /> New property
            </Button>
          </Link>
        ) : null}
      </div>

      <DashboardPropertyGrid properties={properties} />
    </div>
  );
}
