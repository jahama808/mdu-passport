import { createServiceClient } from "@/lib/supabase/server";

export type AgentIdentity = { name: string };

export async function verifyAgentToken(
  request: Request,
): Promise<AgentIdentity | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const db = createServiceClient();
  const { data, error } = await db
    .from("api_tokens")
    .select("name")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return { name: data.name };
}
