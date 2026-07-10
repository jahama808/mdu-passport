import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { getProject, getProperty, listProjectNotes } from "@/lib/data";
import {
  titleCase,
  formatDate,
  projectStatusColor,
  isOverdue,
} from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectFormDialog from "@/components/project-form-dialog";
import ProjectStatusSelect from "@/components/project-status-select";
import ProjectNotes from "@/components/project-notes";
import { CalendarClock, StickyNote } from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const { id, projectId } = await params;
  const [property, project, notes] = await Promise.all([
    getProperty(id),
    getProject(projectId),
    listProjectNotes(projectId),
  ]);
  if (!property || !project || project.property_id !== id) notFound();

  const overdue = isOverdue(project.due_date, project.status);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <span
              className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${projectStatusColor(
                project.status,
              )}`}
            >
              {titleCase(project.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link
              href={`/properties/${id}/projects`}
              className="hover:underline"
            >
              Projects
            </Link>{" "}
            ·{" "}
            <Link href={`/properties/${id}`} className="hover:underline">
              {property.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite ? (
            <>
              <ProjectStatusSelect
                propertyId={id}
                projectId={project.id}
                status={project.status}
              />
              <ProjectFormDialog propertyId={id} project={project} />
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="text-muted-foreground">
            Created {formatDate(project.created_at)}
          </div>
          <div className={overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            Expected finish: {formatDate(project.due_date)}
            {overdue ? " · overdue" : ""}
          </div>
          {project.completed_at ? (
            <div className="text-green-700 dark:text-green-400">
              Completed {formatDate(project.completed_at)}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {project.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{project.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" /> Working notes
        </h2>
        <ProjectNotes
          propertyId={id}
          projectId={project.id}
          notes={notes}
          canWrite={canWrite}
        />
      </div>
    </div>
  );
}
