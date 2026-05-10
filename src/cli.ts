#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { z } from "zod";
import {
  defaultConfigPath,
  loadConfig,
  normalizeApiUrl,
  saveConfig
} from "./config.js";
import { loginViaBrowser } from "./cli-login-browser.js";
import { buildStructuredInsight, extractInsight } from "./insight.js";
import { readInput } from "./io.js";
import type { InsightCard, InsightRow, Visibility } from "./types.js";

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
  const config = loadConfig();
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
    "Publish an insight: pipe a transcript, or pass --title/--problem/--fix (optional --environment)"
  )
  .option("-f, --file <path>", "Read transcript from a file (transcript mode only)")
  .option("--title <text>", "Structured insight title (requires --problem and --fix)")
  .option("--problem <text>", "Structured problem description")
  .option("--environment <text>", "Structured environment/stack (optional)")
  .option("--fix <text>", "Structured fix")
  .option(
    "-v, --visibility <visibility>",
    "private, team, org, or public",
    "private"
  )
  .option("--dry-run", "Preview the insight without publishing")
  .option("-y, --yes", "Publish without interactive confirmation")
  .action(
    async (options: {
      file?: string;
      visibility: string;
      dryRun?: boolean;
      yes?: boolean;
      title?: string;
      problem?: string;
      environment?: string;
      fix?: string;
    }) => {
      const visibility = visibilitySchema.parse(options.visibility) as Visibility;

      const structKeys = [
        options.title !== undefined,
        options.problem !== undefined,
        options.fix !== undefined,
        options.environment !== undefined
      ].filter(Boolean).length;

      const fullyStructured =
        options.title !== undefined &&
        options.problem !== undefined &&
        options.fix !== undefined;

      if (structKeys > 0 && !fullyStructured) {
        throw new Error(
          "Structured publish requires --title, --problem, and --fix together (optional --environment)."
        );
      }

      if (fullyStructured && options.file) {
        throw new Error("Do not use --file with structured publish; use transcript mode or structured flags only.");
      }

      let card: InsightCard;
      let publishBody:
        | { transcript: string; visibility: Visibility }
        | {
            title: string;
            problem: string;
            environment: string;
            fix: string;
            visibility: Visibility;
          };

      if (fullyStructured) {
        card = buildStructuredInsight({
          title: options.title!,
          problem: options.problem!,
          environment: options.environment ?? "",
          fix: options.fix!,
          visibility
        });
        publishBody = {
          title: card.title,
          problem: card.problem,
          environment: card.environment,
          fix: card.fix,
          visibility: card.visibility
        };
      } else {
        const input = await readInput(options.file);
        if (!input.trim()) {
          throw new Error(
            "No content provided. Pipe a transcript, use --file, or pass --title, --problem, and --fix."
          );
        }

        card = extractInsight(input, visibility);
        publishBody = { transcript: input, visibility: card.visibility };
      }

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
      const response = await fetch(
        new URL("/api/insights/publish", config.apiUrl),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${requireToken(config.accessToken)}`
          },
          body: JSON.stringify(publishBody)
        }
      );
      const payload = (await response.json()) as {
        error?: string;
        insight?: { id: string; title: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Publish failed");
      }

      console.log(
        `Published insight ${payload.insight!.id}: ${payload.insight!.title}`
      );
    }
  );

program
  .command("search")
  .description("Search for prior insights from an error or problem description")
  .argument("[query]", "Search query")
  .option("-f, --file <path>", "Read query from a file")
  .option("-l, --limit <number>", "Number of results", "5")
  .action(
    async (
      query: string | undefined,
      options: { file?: string; limit: string }
    ) => {
      const fileInput = await readInput(options.file);
      const searchQuery = (query ?? fileInput).trim();

      if (!searchQuery) {
        throw new Error(
          "No search query provided. Pass text, --file, or stdin."
        );
      }

      const limit = Number.parseInt(options.limit, 10);
      const config = loadConfig();
      const url = new URL("/api/insights/search", config.apiUrl);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set(
        "limit",
        String(Number.isFinite(limit) ? limit : 5)
      );

      const response = await fetch(url, {
        headers: {
          authorization: `Bearer ${requireToken(config.accessToken)}`
        }
      });
      const payload = (await response.json()) as {
        error?: string;
        results?: InsightRow[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed");
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

  const response = await fetch(new URL("/api/auth/me", apiUrl), {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as {
    error?: string;
    debug?: string;
    user?: { id: string; email: string | null };
  };

  if (!response.ok) {
    const detail = [payload.error, payload.debug].filter(Boolean).join(" — ");
    throw new Error(detail || `HTTP ${response.status}`);
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
