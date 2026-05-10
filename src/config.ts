import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv({ path: ".env" });
loadDotenv({ path: ".env.local", override: true });

/** Used when no URL is set in env or ~/.agent-insights.json (local Next.js dev server). */
export const DEFAULT_API_URL = "http://localhost:3000";

const configSchema = z.object({
  apiUrl: z.string().url(),
  accessToken: z.string().min(1).optional()
});

export type AgentInsightsConfig = z.infer<typeof configSchema>;

export const defaultConfigPath = join(homedir(), ".agent-insights.json");

export function normalizeApiUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function loadConfig(configPath = defaultConfigPath): AgentInsightsConfig {
  const fileConfig = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, "utf8"))
    : {};

  const rawUrl =
    process.env.AGENT_INSIGHTS_API_URL ??
    fileConfig.apiUrl ??
    DEFAULT_API_URL;

  const apiUrl =
    typeof rawUrl === "string" && rawUrl.trim()
      ? normalizeApiUrl(rawUrl.trim())
      : DEFAULT_API_URL;

  const accessToken =
    process.env.AGENT_INSIGHTS_ACCESS_TOKEN ?? fileConfig.accessToken;

  return configSchema.parse({
    apiUrl,
    accessToken:
      typeof accessToken === "string" && accessToken.trim()
        ? accessToken.trim()
        : undefined
  });
}

export function saveConfig(config: AgentInsightsConfig, configPath = defaultConfigPath) {
  const payload: AgentInsightsConfig = {
    ...config,
    apiUrl: normalizeApiUrl(config.apiUrl)
  };
  writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600
  });
}
