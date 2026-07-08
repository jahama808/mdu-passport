import { NextResponse } from "next/server";
import { verifyAgentToken } from "@/lib/agent-auth";
import { listProperties } from "@/lib/data";

export async function GET(request: Request) {
  const agent = await verifyAgentToken(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const properties = await listProperties();
  return NextResponse.json({
    properties: properties.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      island: p.island,
      address: p.address,
    })),
  });
}
