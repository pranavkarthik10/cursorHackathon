/** Default CLōD OpenAI-compatible API base (no trailing slash). */
export const CLOD_API_BASE_DEFAULT = "https://api.clod.io/v1";

/** Text used for retrieval; keep in sync with publish-time embedding input. */
export function insightEmbeddingText(parts: {
  title: string;
  problem: string;
  environment: string;
  fix: string;
}): string {
  return [parts.title, parts.problem, parts.environment, parts.fix]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");
}

const EMBED_DIM = 1536;

function embeddingEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/embeddings`;
}

/** CLōD embeddings are opt-in (`CLOD_EMBEDDINGS_ENABLED=true`); default is OpenAI-only when keys exist. */
function clodEmbeddingsEnabled(): boolean {
  const v = process.env.CLOD_EMBEDDINGS_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function resolveEmbeddingTarget(): { url: string; apiKey: string; label: string } | null {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/embeddings",
      apiKey: openaiKey,
      label: "OpenAI"
    };
  }

  const clodKey = process.env.CLOD_API_KEY?.trim();
  const clodBase =
    process.env.CLOD_API_BASE_URL?.trim().replace(/\/+$/, "") || CLOD_API_BASE_DEFAULT;
  if (clodEmbeddingsEnabled() && clodKey) {
    return {
      url: embeddingEndpoint(clodBase),
      apiKey: clodKey,
      label: "CLōD"
    };
  }

  return null;
}

function embeddingModelForTarget(label: string): string {
  if (label === "CLōD") {
    return process.env.CLOD_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  }
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

/**
 * Returns a 1536-dim embedding, or null if no provider is available.
 * Uses OpenAI when `OPENAI_API_KEY` is set; otherwise CLōD only if `CLOD_EMBEDDINGS_ENABLED=true` and `CLOD_API_KEY` is set.
 * Throws if the API returns an error or a wrong-length vector.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const target = resolveEmbeddingTarget();
  if (!target) {
    return null;
  }

  const input = text.trim().slice(0, 30_000);
  if (!input) {
    return null;
  }

  const model = embeddingModelForTarget(target.label);
  const res = await fetch(target.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${target.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input,
      dimensions: EMBED_DIM
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${target.label} embeddings failed: ${res.status} ${err.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const emb = json.data?.[0]?.embedding;
  if (!emb || emb.length !== EMBED_DIM) {
    throw new Error(
      `${target.label} embeddings: expected ${EMBED_DIM} dimensions, got ${emb?.length ?? 0}`
    );
  }

  return emb;
}

/** True when publish/search can request embeddings (OpenAI key, or CLōD when explicitly enabled). */
export function hasEmbeddingProvider(): boolean {
  return resolveEmbeddingTarget() !== null;
}

/** Embedding for hybrid search; null when the query is empty, no API key, or the API fails. */
export async function queryEmbeddingForSearch(searchQuery: string): Promise<number[] | null> {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return await embedText(trimmed);
  } catch {
    return null;
  }
}
