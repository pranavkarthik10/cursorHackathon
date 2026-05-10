import type { InsightCard, Visibility } from "./types.js";

const secretPatterns: RegExp[] = [
  /\b(?:sk|pk)_[A-Za-z0-9_]{20,}\b/g,
  /\bghp_[A-Za-z0-9_]{20,}\b/g,
  /\bSUPABASE_(?:SERVICE_ROLE_KEY|ANON_KEY)=\S+/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
];

export function redact(input: string): string {
  return secretPatterns.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    input
  );
}

export function extractInsight(input: string, visibility: Visibility): InsightCard {
  const redacted = redact(input).trim();
  const lines = redacted
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = findLabeledValue(lines, ["title", "issue"]) ?? makeTitle(lines);
  const problem =
    findSection(redacted, ["problem", "symptoms", "issue"]) ??
    summarizeBlock(lines.slice(0, 8));
  const environment =
    findSection(redacted, ["environment", "env", "stack"]) ??
    inferEnvironment(redacted);
  const fix =
    findSection(redacted, ["fix", "solution", "resolved by"]) ??
    summarizeBlock(lines.slice(-8));

  return {
    title,
    problem,
    environment,
    fix,
    visibility
  };
}

function findLabeledValue(lines: string[], labels: string[]) {
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(new RegExp(`^${label}\\s*:?\\s*(.+)$`, "i"));
      if (match?.[1]) {
        return clean(match[1]);
      }
    }
  }

  return undefined;
}

function findSection(input: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(
      `(?:^|\\n)#{0,3}\\s*${label}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n#{0,3}\\s*[A-Za-z][A-Za-z ]{1,30}\\s*:?\\s*\\n|$)`,
      "i"
    );
    const match = input.match(pattern);
    if (match?.[1]) {
      return clean(match[1]);
    }
  }

  return undefined;
}

function makeTitle(lines: string[]) {
  const firstError = lines.find((line) =>
    /(error|failed|exception|not found|cannot|undefined|timeout)/i.test(line)
  );
  return clean(firstError ?? lines[0] ?? "Untitled coding agent insight").slice(0, 90);
}

function inferEnvironment(input: string) {
  const hits = [
    "Next.js",
    "Vercel",
    "Supabase",
    "pnpm",
    "npm",
    "Bun",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Postgres"
  ].filter((term) => input.toLowerCase().includes(term.toLowerCase()));

  return hits.length > 0 ? hits.join(", ") : "Unknown";
}

function summarizeBlock(lines: string[]) {
  return clean(lines.join("\n")).slice(0, 1200);
}

function clean(input: string) {
  return input.replace(/\n{3,}/g, "\n\n").trim();
}

