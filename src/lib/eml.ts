import { extract } from "letterparser";
import TurndownService from "turndown";

export type ParsedEmail = {
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  markdown: string;
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.remove(["style", "script"]);

function formatAddress(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(formatAddress).filter(Boolean).join(", ") || null;
  }
  if (typeof value === "object") {
    const obj = value as { name?: string; address?: string };
    if (obj.name && obj.address) return `${obj.name} <${obj.address}>`;
    return obj.address ?? obj.name ?? null;
  }
  return null;
}

export function emlToMarkdown(raw: string): ParsedEmail {
  const parsed = extract(raw);

  const subject = parsed.subject?.trim() || null;
  const from = formatAddress(parsed.from);
  const to = formatAddress(parsed.to);
  const date = parsed.date ? new Date(parsed.date).toISOString() : null;

  let body = "";
  if (parsed.html) {
    body = turndown.turndown(parsed.html);
  } else if (parsed.text) {
    body = parsed.text;
  }

  const headerLines: string[] = [];
  if (subject) headerLines.push(`# ${subject}`);
  const meta: string[] = [];
  if (from) meta.push(`**From:** ${from}`);
  if (to) meta.push(`**To:** ${to}`);
  if (date) meta.push(`**Date:** ${date}`);
  if (meta.length) headerLines.push(meta.join("  \n"));

  const markdown = [headerLines.join("\n\n"), body.trim()]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return { subject, from, to, date, markdown };
}
