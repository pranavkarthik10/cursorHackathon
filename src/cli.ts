#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { z } from "zod";
import { defaultConfigPath, loadConfig, saveConfig } from "./config.js";
import { extractInsight } from "./insight.js";
import { readInput } from "./io.js";
import type { InsightCard, InsightRow, Visibility } from "./types.js";

const visibilitySchema = z.enum(["private", "team", "public"]);

const program = new Command();

program
  .name("agent-insights")
  .description("Publish and search distilled coding-agent session insights")
  .version("0.1.0");

program
  .command("auth")
  .description("Save an API URL and Supabase access token for the CLI")
  .option("--api-url <url>", "Coding Agent Insights app URL")
  .option("--token <token>", "Supabase user access token")
  .action(async (options: { apiUrl?: string; token?: string }) => {
    const answers = await inquirer.prompt([
      {
        name: "apiUrl",
        type: "input",
        message: "App API URL",
        default: "http://localhost:3000",
        when: !options.apiUrl
      },
      {
        name: "accessToken",
        message: "Supabase access token",
        type: "password",
        mask: "*",
        when: !options.token
      }
    ]);

    saveConfig({
      apiUrl: options.apiUrl ?? answers.apiUrl,
      accessToken: options.token ?? answers.accessToken
    });

    console.log(`Saved config to ${defaultConfigPath}`);
  });

program
  .command("publish")
  .description("Extract, preview, and publish an insight from a session transcript")
  .option("-f, --file <path>", "Read transcript from a file")
  .option(
    "-v, --visibility <visibility>",
    "private, team, or public",
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
    }) => {
      const visibility = visibilitySchema.parse(options.visibility);
      const input = await readInput(options.file);

      if (!input.trim()) {
        throw new Error("No transcript provided. Pass --file or pipe text into stdin.");
      }

      const card = extractInsight(input, visibility);
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
      const response = await fetch(`${config.apiUrl}/api/insights/publish`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${requireToken(config.accessToken)}`
        },
        body: JSON.stringify({
          transcript: input,
          visibility: card.visibility
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Publish failed");
      }

      console.log(`Published insight ${payload.insight.id}: ${payload.insight.title}`);
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
        throw new Error("No search query provided. Pass text, --file, or stdin.");
      }

      const limit = Number.parseInt(options.limit, 10);
      const config = loadConfig();
      const url = new URL("/api/insights/search", config.apiUrl);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("limit", String(Number.isFinite(limit) ? limit : 5));

      const response = await fetch(url, {
        headers: {
          authorization: `Bearer ${requireToken(config.accessToken)}`
        }
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed");
      }

      printResults((payload.results ?? []) as InsightRow[]);
    }
  );

program
  .command("doctor")
  .description("Check local CLI configuration")
  .action(() => {
    const config = loadConfig();
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`Access token: ${config.accessToken ? "configured" : "missing"}`);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`agent-insights: ${message}`);
  process.exitCode = 1;
});

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
    throw new Error("Run agent-insights auth first or set AGENT_INSIGHTS_ACCESS_TOKEN.");
  }

  return token;
}
