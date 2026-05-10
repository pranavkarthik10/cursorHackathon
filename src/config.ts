import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

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

  const rawUrl = process.env.AGENT_INSIGHTS_API_URL ?? fileConfig.apiUrl;
  const apiUrl =
    typeof rawUrl === "string" && rawUrl.trim()
      ? normalizeApiUrl(rawUrl.trim())
      : rawUrl;

  return configSchema.parse({
    apiUrl,
    accessToken: process.env.AGENT_INSIGHTS_ACCESS_TOKEN ?? fileConfig.accessToken
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
