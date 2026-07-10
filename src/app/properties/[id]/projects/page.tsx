import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { getProperty, listProjects } from "@/lib/data";
import {
  titleCase,
  formatDate,
  projectStatusColor,
  isOverdue,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import ProjectFormDialog from "@/components/project-form-dialog";
import type { PropertyProject } from "@/lib/types";

function ProjectRow({
  propertyId,
  project,
}: {
  propertyId: string;
  project: PropertyProject;
}) {
  const overdue = isOverdue(project.due_date, project.status);
  return (
    <Link
      href={`/properties/${propertyId}/projects/${project.id}`}
      className="block border rounded-md px-3 py-2 hover:border-foreground/20 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate">{project.title}</span>
        <span
          className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${projectStatusColor(
            project.status,
          )}`}
        >
          {titleCase(project.status)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {project.status === "completed" && project.completed_at ? (
          <>Completed {formatDate(project.completed_at)}</>
        ) : project.due_date ? (
          <span className={overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            Expected finish {formatDate(project.due_date)}
            {overdue ? " · overdue" : ""}
          </span>
        ) : (
          <>No expected finish date</>
        )}
      </div>
      {project.description ? (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {project.description}
        </p>
      ) : null}
    </Link>
  );
}

export default async function PropertyProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const { id } = await params;
  const [property, projects] = await Promise.all([
    getProperty(id),
    listProjects(id),
  ]);
  if (!property) notFound();

  const active = projects.filter((p) => p.status !== "completed");
  const completed = projects.filter((p) => p.status === "completed");

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/properties/${id}`} className="hover:underline">
              {property.name}
            </Link>
          </p>
        </div>
        {canWrite ? <ProjectFormDialog propertyId={id} /> : null}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-center text-muted-foreground">
              No active projects.
            </CardContent>
          </Card>
        ) : (
          active.map((p) => <ProjectRow key={p.id} propertyId={id} project={p} />)
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Completed ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed projects yet.
          </p>
        ) : (
          completed.map((p) => (
            <ProjectRow key={p.id} propertyId={id} project={p} />
          ))
        )}
      </div>
    </div>
  );
}
