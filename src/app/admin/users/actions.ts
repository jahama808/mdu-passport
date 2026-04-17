"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Role } from "@/lib/auth";

function normalizeRole(raw: unknown): Role {
  return raw === "admin" ? "admin" : "viewer";
}

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  lastSignInAt: string | null;
};

export async function listUsers(): Promise<AdminUser[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      role: normalizeRole(u.app_metadata?.role),
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function createUser(input: { email: string; password: string; role: Role }) {
  await requireAdmin();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email required");
  if (!input.password || input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const role = normalizeRole(input.role);
  const db = createServiceClient();
  const { error } = await db.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  const next = normalizeRole(role);
  const db = createServiceClient();
  const { data: target, error: readErr } = await db.auth.admin.getUserById(userId);
  if (readErr) throw readErr;
  if (admin.id === userId && next !== "admin") {
    throw new Error("You cannot demote yourself");
  }
  const { error } = await db.auth.admin.updateUserById(userId, {
    app_metadata: { ...(target.user?.app_metadata ?? {}), role: next },
  });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string, password: string) {
  await requireAdmin();
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const db = createServiceClient();
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("You cannot delete yourself");
  const db = createServiceClient();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
  revalidatePath("/admin/users");
}
