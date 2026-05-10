#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { z } from "zod";
import { defaultConfigPath, loadConfig, saveConfig } from "./config.js";
import { extractInsight } from "./insight.js";
import { readInput } from "./io.js";
import { createSupabaseClient } from "./supabase.js";
import type { InsightCard, InsightRow, Visibility } from "./types.js";

const visibilitySchema = z.enum(["private", "team", "public"]);

const program = new Command();

program
  .name("agent-insights")
  .description("Publish and search distilled coding-agent session insights")
  .version("0.1.0");

program
  .command("init")
  .description("Save Supabase credentials for the CLI")
  .option("--url <url>", "Supabase project URL")
  .option("--service-role-key <key>", "Supabase service role key")
  .action(async (options: { url?: string; serviceRoleKey?: string }) => {
    const answers = await inquirer.prompt([
      {
        name: "supabaseUrl",
        type: "input",
        message: "Supabase URL",
        when: !options.url
      },
      {
        name: "supabaseServiceRoleKey",
        message: "Supabase service role key",
        type: "password",
        mask: "*",
        when: !options.serviceRoleKey
      }
    ]);

    saveConfig({
      supabaseUrl: options.url ?? answers.supabaseUrl,
      supabaseServiceRoleKey:
        options.serviceRoleKey ?? answers.supabaseServiceRoleKey
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

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("insights")
        .insert(card)
        .select("id,title")
        .single();

      if (error) {
        throw error;
      }

      console.log(`Published insight ${data.id}: ${data.title}`);
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

      const supabase = createSupabaseClient();
      const limit = Number.parseInt(options.limit, 10);
      const { data, error } = await supabase.rpc("search_insights", {
        search_query: searchQuery,
        result_limit: Number.isFinite(limit) ? limit : 5
      });

      if (error) {
        throw error;
      }

      printResults((data ?? []) as InsightRow[]);
    }
  );

program
  .command("doctor")
  .description("Check local CLI configuration")
  .action(() => {
    const config = loadConfig();
    console.log(`Supabase URL: ${config.supabaseUrl}`);
    console.log("Supabase service role key: configured");
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
