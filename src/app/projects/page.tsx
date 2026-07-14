import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { listActiveProjects } from "@/lib/data";
import { isOverdue } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import ActiveProjectsGrid from "@/components/active-projects-grid";

export default async function ProjectsOverviewPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const projects = await listActiveProjects();
  const overdueCount = projects.filter((p) =>
    isOverdue(p.due_date, p.status),
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} ongoing project{projects.length === 1 ? "" : "s"}
          {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""} · sorted by
          priority (P1 highest, P10 lowest) · completed projects live on each
          property page
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No ongoing projects. Create one from a property page.
          </CardContent>
        </Card>
      ) : (
        <ActiveProjectsGrid projects={projects} canWrite={role === "admin"} />
      )}
    </div>
  );
}
