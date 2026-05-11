import type { InsightCard, Visibility } from "./types.js";

const secretPatterns: RegExp[] = [
  /\b(?:sk|pk)_[A-Za-z0-9_]{20,}\b/g,
  /\bghp_[A-Za-z0-9_]{20,}\b/g,
  /\b(?:NEXT_PUBLIC_)?SUPABASE_(?:SERVICE_ROLE_KEY|ANON_KEY|PUBLISHABLE_KEY)=\S+/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
];

export function redact(input: string): string {
  return secretPatterns.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    input
  );
}

/** Build a redacted insight card from structured fields. */
export function buildStructuredInsight(input: {
  title: string;
  problem: string;
  environment: string;
  fix: string;
  visibility: Visibility;
}): InsightCard {
  const titleRaw = redact(input.title).trim();
  const title =
    (titleRaw.slice(0, 500) || "Untitled").replace(/\n{3,}/g, "\n\n");

  const problem = clamp(redact(input.problem), 12_000);
  const environment =
    clamp(redact(input.environment), 4_000).trim() || "Unknown";
  const fix = clamp(redact(input.fix), 12_000);

  return { title, problem, environment, fix, visibility: input.visibility };
}

function clamp(text: string, max: number) {
  const t = text.replace(/\n{3,}/g, "\n\n").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}
