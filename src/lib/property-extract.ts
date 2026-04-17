import Anthropic from "@anthropic-ai/sdk";
import type { PropertyDetails } from "@/lib/types";

const TOOL_NAME = "record_sales_notification";

const tool = {
  name: TOOL_NAME,
  description:
    "Record sales-notification facts you can confidently extract from the email. Omit fields the email does not state — never guess. Dates should be ISO (YYYY-MM-DD) when possible.",
  input_schema: {
    type: "object" as const,
    properties: {
      contract_number: { type: "string", description: "Contract, order, or PO number" },
      customer: { type: "string", description: "Account / customer / property name" },
      service_type: {
        type: "string",
        description: "e.g. GigaFiber, MDU Internet, Bulk Internet",
      },
      plan_speed: { type: "string", description: "e.g. 1 Gbps, 500/500 Mbps" },
      num_units: { type: "string", description: "Number of units served" },
      mrc: { type: "string", description: "Monthly recurring charge, including currency" },
      contract_start: { type: "string", description: "Contract / service start date" },
      contract_term: { type: "string", description: "Term length, e.g. 36 months" },
      install_date: { type: "string", description: "Activation or install date / deadline" },
      sales_rep: { type: "string", description: "Sales representative name" },
      account_manager: { type: "string", description: "Account manager name" },
      scope: {
        type: "string",
        description: "Short scope-of-work / project description (markdown allowed)",
      },
    },
    additionalProperties: false,
  },
};

export async function extractPropertyDetails(
  markdown: string,
): Promise<PropertyDetails> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [tool],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Extract sales-notification fields from this email. Only include fields the email explicitly supports.\n\n---\n\n${markdown}`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return {};
  return toolUse.input as PropertyDetails;
}
