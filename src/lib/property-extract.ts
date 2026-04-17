import Anthropic from "@anthropic-ai/sdk";
import { ISLANDS, PROPERTY_TYPES, type Island, type PropertyType } from "@/lib/types";

export type ExtractedProperty = {
  name?: string;
  type?: PropertyType;
  address?: string;
  island?: Island;
  gm_name?: string;
  gm_email?: string;
  notes?: string;
};

const TOOL_NAME = "record_property_facts";

const tool = {
  name: TOOL_NAME,
  description:
    "Record any property facts (name, address, GM contact, type, island, notes) you can confidently extract from the email. Omit fields when the email does not clearly state them — do not guess.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Property / building name" },
      type: { type: "string", enum: PROPERTY_TYPES },
      address: { type: "string", description: "Full street address" },
      island: { type: "string", enum: ISLANDS },
      gm_name: { type: "string", description: "General manager / primary contact name" },
      gm_email: { type: "string", description: "GM / primary contact email" },
      notes: {
        type: "string",
        description:
          "Short free-text notes capturing useful context (project status, scope, deadlines, special requirements). Markdown allowed.",
      },
    },
    additionalProperties: false,
  },
};

export async function extractPropertyFromMarkdown(
  markdown: string,
): Promise<ExtractedProperty> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [tool],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Extract property information from this email. Only include fields the email explicitly supports.\n\n---\n\n${markdown}`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return {};
  return toolUse.input as ExtractedProperty;
}
