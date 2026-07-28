import Anthropic from "@anthropic-ai/sdk";

const TOOL_NAME = "record_update_summaries";

const tool = {
  name: TOOL_NAME,
  description:
    "Record a one-line summary of the most recent update for each project. Every project in the input must appear exactly once in the output.",
  input_schema: {
    type: "object" as const,
    properties: {
      summaries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            project_id: { type: "string" },
            summary: {
              type: "string",
              description:
                "One plain-language sentence (max ~25 words) capturing the latest status or action from the note",
            },
          },
          required: ["project_id", "summary"],
          additionalProperties: false,
        },
      },
    },
    required: ["summaries"],
    additionalProperties: false,
  },
};

export type NoteToSummarize = {
  projectId: string;
  projectTitle: string;
  note: string;
};

function truncate(text: string, max = 200): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Summarize the latest note for each project into a one-line "recent update".
 * Falls back to truncated raw note text when the API is unavailable or fails.
 */
export async function summarizeRecentUpdates(
  items: NoteToSummarize[],
): Promise<Record<string, string>> {
  const fallback: Record<string, string> = {};
  for (const item of items) fallback[item.projectId] = truncate(item.note);
  if (items.length === 0) return fallback;
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  const notesBlock = items
    .map(
      (item) =>
        `<note project_id="${item.projectId}" project="${item.projectTitle}">\n${truncate(item.note, 2000)}\n</note>`,
    )
    .join("\n\n");

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      tools: [tool],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [
        {
          role: "user",
          content: `Each note below is the most recent update logged for a project at a property. Summarize each into one short plain-language sentence for a status spreadsheet — lead with what happened or what is blocked, keep names and dates that matter, drop filler.\n\n${notesBlock}`,
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return fallback;
    const input = toolUse.input as {
      summaries?: { project_id: string; summary: string }[];
    };
    const out = { ...fallback };
    for (const s of input.summaries ?? []) {
      if (s.project_id && s.summary && out[s.project_id] !== undefined) {
        out[s.project_id] = s.summary.trim();
      }
    }
    return out;
  } catch {
    return fallback;
  }
}
