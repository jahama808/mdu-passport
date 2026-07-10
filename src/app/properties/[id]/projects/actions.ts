"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { ProjectStatus } from "@/lib/types";
import { PROJECT_STATUSES } from "@/lib/types";

export type ProjectInput = {
  title: string;
  description: string | null;
  status: ProjectStatus;
  due_date: string | null;
};

function revalidateProject(propertyId: string, projectId?: string) {
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/projects`);
  if (projectId) revalidatePath(`/properties/${propertyId}/projects/${projectId}`);
  revalidatePath(`/projects`);
}

function validateInput(input: ProjectInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Project title is required");
  if (!PROJECT_STATUSES.includes(input.status)) throw new Error("Invalid status");
  return {
    title,
    description: input.description?.trim() || null,
    status: input.status,
    due_date: input.due_date || null,
  };
}

export async function createProject(propertyId: string, input: ProjectInput) {
  await requireAdmin();
  const db = createServiceClient();
  const values = validateInput(input);
  const { error } = await db.from("property_projects").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    ...values,
    completed_at: values.status === "completed" ? new Date().toISOString() : null,
  });
  if (error) throw error;
  revalidateProject(propertyId);
}

export async function updateProject(
  propertyId: string,
  projectId: string,
  input: ProjectInput,
) {
  await requireAdmin();
  const db = createServiceClient();
  const values = validateInput(input);
  const { data: existing, error: fetchError } = await db
    .from("property_projects")
    .select("status, completed_at")
    .eq("id", projectId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Project not found");
  const completed_at =
    values.status === "completed"
      ? existing.completed_at ?? new Date().toISOString()
      : null;
  const { error } = await db
    .from("property_projects")
    .update({ ...values, completed_at, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidateProject(propertyId, projectId);
}

export async function updateProjectStatus(
  propertyId: string,
  projectId: string,
  status: ProjectStatus,
) {
  await requireAdmin();
  if (!PROJECT_STATUSES.includes(status)) throw new Error("Invalid status");
  const db = createServiceClient();
  const { error } = await db
    .from("property_projects")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidateProject(propertyId, projectId);
}

export async function deleteProject(propertyId: string, projectId: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("property_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidateProject(propertyId);
}

export async function addProjectNote(
  propertyId: string,
  projectId: string,
  content: string,
) {
  await requireAdmin();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Note cannot be empty");
  const db = createServiceClient();
  const { error } = await db.from("project_notes").insert({
    user_id: WORKSPACE_OWNER_ID,
    project_id: projectId,
    content: trimmed,
  });
  if (error) throw error;
  revalidateProject(propertyId, projectId);
}

export async function deleteProjectNote(
  propertyId: string,
  projectId: string,
  noteId: string,
) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("project_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidateProject(propertyId, projectId);
}
