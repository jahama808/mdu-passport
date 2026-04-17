import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "viewer";

export function roleOf(user: User | null | undefined): Role {
  const raw = user?.app_metadata?.role;
  return raw === "admin" ? "admin" : "viewer";
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, role: roleOf(user) };
}

export async function requireAdmin() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/");
  return user;
}

export async function isAdmin() {
  const { role } = await getSessionContext();
  return role === "admin";
}
