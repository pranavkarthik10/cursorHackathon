#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { z } from "zod";
import {
  defaultConfigPath,
  loadConfig,
  normalizeApiUrl,
  saveConfig,
  type AgentInsightsConfig
} from "./config.js";
import { loginViaBrowser } from "./cli-login-browser.js";
import { buildStructuredInsight } from "./insight.js";
import {
  isJwtExpired,
  jwtExpiryIsoDate,
  looksLikeJwt
} from "./lib/jwt-expiry.js";
import type { InsightCard, InsightRow, Visibility } from "./types.js";

const CLI_FETCH_TIMEOUT_MS = Math.max(
  3000,
  Number.parseInt(process.env.AGENT_INSIGHTS_FETCH_TIMEOUT_MS ?? "20000", 10) || 20000
);

type ApiErrorPayload = {
  error?: string;
  hint?: string;
  debug?: string;
};

function formatApiAuthFailure(payload: ApiErrorPayload): string {
  const lines = [
    payload.error ?? "Request failed",
    payload.hint,
    payload.debug ? `(debug) ${payload.debug}` : undefined
  ].filter(Boolean);
  return lines.join("\n");
}

async function fetchWithTimeout(
  url: URL | string,
  init: RequestInit = {},
  timeoutMs = CLI_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const href = typeof url === "string" ? url : url.href;
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const msg = err instanceof Error ? err.message : String(err);
    if (name === "AbortError" || msg.includes("aborted")) {
      throw new Error(
        `Request timed out after ${timeoutMs}ms (${href}). Start the dev server (npm run dev) or fix AGENT_INSIGHTS_API_URL.`
      );
    }
    throw new Error(`Could not reach API (${href}): ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `API returned non-JSON (HTTP ${response.status}). First bytes: ${text.slice(0, 180)}`
    );
  }
}

async function promptBrowserRelogin(apiUrl: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error(
      "Cannot open interactive login (stdin is not a TTY). Run `agent-insights auth login` manually."
    );
  }

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: "confirm",
      name: "confirm",
      message: "Sign in again in your browser now?",
      default: true
    }
  ]);

  if (!confirm) {
    throw new Error("Sign-in cancelled.");
  }

  const accessToken = await loginViaBrowser(apiUrl);
  await finishLogin(apiUrl, accessToken.trim(), {
    persistTokenToFile: true,
    sourceNote: "saved in config file (browser sign-in)"
  });
  return accessToken.trim();
}

/**
 * If the stored token is a JWT with an expired `exp`, optionally prompt for browser login.
 */
async function resolveAccessTokenBeforeRequest(
  apiUrl: string,
  token: string
): Promise<string> {
  if (!looksLikeJwt(token) || !isJwtExpired(token)) {
    return token;
  }

  const when = jwtExpiryIsoDate(token);
  console.error(
    when
      ? `Saved access token expired at ${when} (JWT exp).`
      : "Saved access token appears expired (JWT exp)."
  );

  if (process.stdin.isTTY) {
    return promptBrowserRelogin(apiUrl);
  }

  throw new Error(
    "Access token expired. Run `agent-insights auth login` or set a fresh AGENT_INSIGHTS_ACCESS_TOKEN."
  );
}

async function fetchAuthenticatedWithRelogin<T extends ApiErrorPayload>(
  apiUrl: string,
  initialToken: string,
  perform: (token: string) => Promise<Response>
): Promise<{ response: Response; payload: T }> {
  let token = initialToken;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await perform(token);
    const payload = (await readJsonBody(response)) as T;

    if (
      response.ok ||
      attempt === 1 ||
      response.status !== 401 ||
      !process.stdin.isTTY
    ) {
      return { response, payload };
    }

    console.error(formatApiAuthFailure(payload));
    token = await promptBrowserRelogin(apiUrl);
  }

  throw new Error("Authentication failed after retry.");
}

const visibilitySchema = z.enum(["private", "team", "org", "public"]);

const program = new Command();

program
  .name("agent-insights")
  .description("Publish and search distilled coding-agent session insights")
  .version("0.1.0");

async function loginAction(options: {
  apiUrl?: string;
  token?: string;
  noBrowser?: boolean;
}) {
  const resolved = loadConfig();
  const apiUrl = normalizeApiUrl(options.apiUrl ?? resolved.apiUrl);
  const envToken = process.env.AGENT_INSIGHTS_ACCESS_TOKEN?.trim();

  if (options.token?.trim()) {
    await finishLogin(apiUrl, options.token.trim(), {
      persistTokenToFile: true,
      sourceNote: "from --token"
    });
    return;
  }

  if (envToken) {
    await finishLogin(apiUrl, envToken, {
      persistTokenToFile: false,
      sourceNote: "from AGENT_INSIGHTS_ACCESS_TOKEN (not written to config file)"
    });
    return;
  }

  const saved = resolved.accessToken?.trim();
  if (saved) {
    try {
      await verifySession(apiUrl, saved);
      saveConfig({ apiUrl, accessToken: saved });
      console.log(`Already signed in — token in ${defaultConfigPath} is valid.`);
      console.log(`API URL: ${apiUrl}`);
      console.log("Session verified with /api/auth/me.");
      return;
    } catch {
      if (!options.noBrowser) {
        console.log(
          "Saved token failed verification (wrong project, expired JWT, or API down). Starting browser sign-in…\n"
        );
      } else {
        console.log(
          "Saved token failed verification. Paste a new token below.\n"
        );
      }
    }
  }

  let accessToken: string | undefined;
  let fromBrowser = false;

  if (options.noBrowser) {
    const { accessToken: prompted } = await inquirer.prompt([
      {
        name: "accessToken",
        message:
          "Supabase access token (JWT), or set AGENT_INSIGHTS_ACCESS_TOKEN in .env",
        type: "password",
        mask: "*"
      }
    ]);
    accessToken = prompted?.trim();
  } else {
    accessToken = await loginViaBrowser(apiUrl);
    fromBrowser = true;
  }

  if (!accessToken?.trim()) {
    throw new Error(
      "No access token. Set AGENT_INSIGHTS_ACCESS_TOKEN, use browser login, or paste a token when prompted."
    );
  }

  await finishLogin(apiUrl, accessToken, {
    persistTokenToFile: true,
    sourceNote: fromBrowser
      ? "saved in config file (browser sign-in)"
      : "saved in config file (pasted token)"
  });
}

async function finishLogin(
  apiUrl: string,
  accessToken: string,
  opts: { persistTokenToFile: boolean; sourceNote: string }
) {
  if (opts.persistTokenToFile) {
    saveConfig({ apiUrl, accessToken });
  } else {
    saveConfig({ apiUrl });
  }

  console.log(`Saved config to ${defaultConfigPath}`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`Access token: ${opts.sourceNote}.`);

  try {
    await verifySession(apiUrl, accessToken);
    console.log("Session verified with /api/auth/me.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`Could not verify the token: ${msg}`);
    console.warn(
      "Check that `npm run dev` is running, and that .env has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for the same Supabase project as the browser login."
    );
  }
}

async function logoutAction() {
  let config: AgentInsightsConfig | null = null;
  try {
    config = loadConfig();
  } catch {
    console.log("No configuration found. Nothing to remove.");
    return;
  }
  if (!config.accessToken) {
    console.log("No access token was stored.");
    return;
  }
  saveConfig({ apiUrl: config.apiUrl });
  console.log("Removed stored access token.");
}

const authCmd = program
  .command("auth")
  .description("Manage CLI credentials for the Coding Agent Insights API");

authCmd
  .command("login", { isDefault: true })
  .description(
    "Sign in via browser (default) or paste a token; uses http://localhost:3000 unless overridden"
  )
  .option("--api-url <url>", "Override API URL (default: env, config, or localhost)")
  .option("--token <token>", "Supabase access token (JWT); skips browser")
  .option("--no-browser", "Do not open a browser; paste a token instead")
  .action(loginAction);

authCmd.command("logout").description("Remove the stored access token").action(logoutAction);

program
  .command("init")
  .description("Alias for `auth login`")
  .option("--api-url <url>", "Override API URL")
  .option("--token <token>", "Supabase access token")
  .option("--no-browser", "Paste a token instead of opening the browser")
  .action(loginAction);

program
  .command("publish")
  .description(
    "Publish an insight: pass --title, --problem, and --fix (--environment optional)"
  )
  .option("--title <text>", "Insight title")
  .option("--problem <text>", "What broke and what error appeared")
  .option("--environment <text>", "Stack, versions, platform (optional)")
  .option("--fix <text>", "Exact steps that resolved it")
  .option(
    "-v, --visibility <visibility>",
    "private, team, org, or public",
    "private"
  )
  .option("--dry-run", "Preview the insight without publishing")
  .option("-y, --yes", "Publish without interactive confirmation")
  .action(
    async (options: {
      visibility: string;
      dryRun?: boolean;
      yes?: boolean;
      title?: string;
      problem?: string;
      environment?: string;
      fix?: string;
    }) => {
      const visibility = visibilitySchema.parse(options.visibility) as Visibility;

      if (!options.title || !options.problem || !options.fix) {
        throw new Error(
          "publish requires --title, --problem, and --fix (--environment is optional)."
        );
      }

      const card: InsightCard = buildStructuredInsight({
        title: options.title,
        problem: options.problem,
        environment: options.environment ?? "",
        fix: options.fix,
        visibility
      });

      const publishBody = {
        title: card.title,
        problem: card.problem,
        environment: card.environment,
        fix: card.fix,
        visibility: card.visibility
      };

      printCard(card);

      if (options.dryRun) {
        console.log("Dry run complete. Nothing was published.");
        return;
      }

      if (!options.yes) {
        const { shouldPublish } = await inquirer.prompt([
          {
            name: "shouldPublish",
            message: "Publish this distilled insight?",
            type: "confirm",
            default: false
          }
        ]);

        if (!shouldPublish) {
          console.log("Skipped publish.");
          return;
        }
      }

      const config = loadConfig();
      let accessToken = requireToken(config.accessToken);
      accessToken = await resolveAccessTokenBeforeRequest(config.apiUrl, accessToken);

      const { response, payload } = await fetchAuthenticatedWithRelogin<{
        error?: string;
        hint?: string;
        insight?: { id: string; title: string };
      }>(config.apiUrl, accessToken, (token) =>
        fetchWithTimeout(new URL("/api/insights/publish", config.apiUrl), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`
          },
          body: JSON.stringify(publishBody)
        })
      );

      if (!response.ok) {
        throw new Error(formatApiAuthFailure(payload) || "Publish failed");
      }

      if (!payload.insight) {
        throw new Error("Publish succeeded but the API response did not include an insight id.");
      }

      console.log(`Published insight ${payload.insight.id}: ${payload.insight.title}`);
    }
  );

program
  .command("search")
  .description("Search for prior insights from an error or problem description")
  .argument("<query>", "Error message, symptom, or short description")
  .option("-l, --limit <number>", "Number of results", "5")
  .action(
    async (
      query: string,
      options: { limit: string }
    ) => {
      const searchQuery = query.trim();

      if (!searchQuery) {
        throw new Error("No search query provided.");
      }

      const limit = Number.parseInt(options.limit, 10);
      const config = loadConfig();
      let accessToken = requireToken(config.accessToken);
      accessToken = await resolveAccessTokenBeforeRequest(config.apiUrl, accessToken);

      const url = new URL("/api/insights/search", config.apiUrl);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set(
        "limit",
        String(Number.isFinite(limit) ? limit : 5)
      );

      const { response, payload } = await fetchAuthenticatedWithRelogin<{
        error?: string;
        hint?: string;
        results?: InsightRow[];
      }>(config.apiUrl, accessToken, (token) =>
        fetchWithTimeout(url, {
          headers: {
            authorization: `Bearer ${token}`
          }
        })
      );

      if (!response.ok) {
        throw new Error(formatApiAuthFailure(payload) || "Search failed");
      }

      printResults((payload.results ?? []) as InsightRow[]);
    }
  );

program
  .command("doctor")
  .description("Check local CLI configuration and API reachability")
  .action(async () => {
    const config = loadConfig();
    console.log(`API URL: ${config.apiUrl}`);

    if (!config.accessToken) {
      console.log(
        "Access token: missing (set AGENT_INSIGHTS_ACCESS_TOKEN in .env or run `agent-insights auth login`)"
      );
      return;
    }

    console.log(
      process.env.AGENT_INSIGHTS_ACCESS_TOKEN
        ? "Access token: from AGENT_INSIGHTS_ACCESS_TOKEN"
        : "Access token: from config file"
    );

    try {
      const me = await verifySession(config.apiUrl, config.accessToken);
      console.log(`API session: ok (${me.user.email ?? me.user.id})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`API session: failed (${message})`);
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`agent-insights: ${message}`);
  process.exitCode = 1;
});

async function verifySession(apiUrl: string, token: string | undefined) {
  if (!token) {
    throw new Error("Missing access token");
  }

  const response = await fetchWithTimeout(new URL("/api/auth/me", apiUrl), {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = (await readJsonBody(response)) as {
    error?: string;
    hint?: string;
    debug?: string;
    user?: { id: string; email: string | null };
  };

  if (!response.ok) {
    throw new Error(formatApiAuthFailure(payload) || `HTTP ${response.status}`);
  }

  if (!payload.user) {
    throw new Error("Invalid response from /api/auth/me");
  }

  return { user: payload.user };
}

function printCard(card: InsightCard) {
  console.log("\nInsight preview");
  console.log("---------------");
  console.log(`Title: ${card.title}`);
  console.log(`Visibility: ${card.visibility}`);
  console.log(`Environment: ${card.environment}`);
  console.log("\nProblem:");
  console.log(card.problem);
  console.log("\nFix:");
  console.log(card.fix);
  console.log("");
}

function printResults(results: InsightRow[]) {
  if (results.length === 0) {
    console.log("No matching insights found.");
    return;
  }

  for (const [index, result] of results.entries()) {
    console.log(`\n${index + 1}. ${result.title}`);
    console.log(`   id: ${result.id}`);
    console.log(`   visibility: ${result.visibility}`);
    console.log(`   environment: ${result.environment || "Unknown"}`);
    if (typeof result.rank === "number") {
      console.log(`   rank: ${result.rank.toFixed(4)}`);
    }
    console.log(`   problem: ${oneLine(result.problem)}`);
    console.log(`   fix: ${oneLine(result.fix)}`);
  }
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function requireToken(token: string | undefined) {
  if (!token) {
    throw new Error(
      "Run `agent-insights auth login` (browser sign-in), set AGENT_INSIGHTS_ACCESS_TOKEN, or use --token."
    );
  }

  return token;
}
