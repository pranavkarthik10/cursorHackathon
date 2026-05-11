"use client";

import { useCallback, useState } from "react";
import { Bot, Copy, Terminal } from "lucide-react";
import { AgentTabIcon } from "@/components/agent-tab-icons";

const C = {
  bgElevated: "#111318",
  bgHighlight: "#191c23",
  fg: "#e8ecf4",
  fgMuted: "#7a8499",
  accentBright: "#7aa3eb",
  border: "#1e2230",
  borderBright: "#2a3048",
  termGreen: "#5abf7a",
} as const;

type FlowMode = "terminal" | "agent";
type Pm = "npx" | "yarn" | "pnpm" | "bun";
type AgentTool = "claude" | "cursor" | "opencode" | "codex";

const TERMINAL_CMD: Record<Pm, string> = {
  npx: "npx agent-insights --help",
  yarn: "yarn dlx agent-insights --help",
  pnpm: "pnpm dlx agent-insights --help",
  bun: "bunx agent-insights --help",
};

const ONBOARDING_PROMPTS: Record<AgentTool, string> = {
  claude: `Set up Agent Insights for this repo (Claude Code):

1. Download the skill so Claude auto-suggests publishing after hard sessions:
   curl -o SKILL.md https://raw.githubusercontent.com/pranavkarthik10/cursorHackathon/main/SKILL.md

2. After sessions that fix a non-trivial bug, offer to distill and publish an insight — never upload raw transcripts without user consent.
3. CLI (once per machine): npx agent-insights auth login
4. Publish: npx agent-insights publish   ·   Search: npx agent-insights search "error or symptom"`,

  cursor: `Configure Agent Insights in Cursor:

1. Install the skill so Cursor auto-suggests publishing at session end:
   curl -o .cursor/skills/agent-insights/SKILL.md --create-dirs \\
     https://raw.githubusercontent.com/pranavkarthik10/cursorHackathon/main/SKILL.md

2. Authenticate once: npx agent-insights auth login

3. At session end Cursor will automatically offer to publish if a real fix was found.
   Or trigger manually: npx agent-insights publish
   Search: npx agent-insights search "your error or stack trace"`,

  opencode: `Add Agent Insights for OpenCode:

1. Download the skill to your repo root:
   curl -o SKILL.md https://raw.githubusercontent.com/pranavkarthik10/cursorHackathon/main/SKILL.md

2. Prefer structured insights (title, problem, environment, fix) over pasting full chat logs.
3. npx agent-insights auth login once per machine.
4. npx agent-insights publish   ·   npx agent-insights search "query"`,

  codex: `Integrate Agent Insights with Codex:

1. Download the skill to your project:
   curl -o SKILL.md https://raw.githubusercontent.com/pranavkarthik10/cursorHackathon/main/SKILL.md

2. Redact secrets and proprietary names before confirming publish.
3. npx agent-insights auth login
4. npx agent-insights publish   ·   npx agent-insights search "symptom or package error"`,
};

const AGENT_LABEL: Record<AgentTool, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  opencode: "OpenCode",
  codex: "Codex",
};

export function InstallFlow() {
  const [mode, setMode] = useState<FlowMode>("terminal");
  const [pm, setPm] = useState<Pm>("npx");
  const [agent, setAgent] = useState<AgentTool>("claude");
  const [copied, setCopied] = useState(false);

  const commandLine = TERMINAL_CMD[pm];
  const agentPrompt = ONBOARDING_PROMPTS[agent];

  const copyText = useCallback(async () => {
    const text = mode === "terminal" ? commandLine : agentPrompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [mode, commandLine, agentPrompt]);

  const segBtn = (active: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-jetbrains), monospace",
      fontSize: "12px",
      fontWeight: 600,
      background: active ? "#fff" : "transparent",
      color: active ? "#0b0d12" : C.fgMuted,
      transition: "background 0.15s, color 0.15s",
    }) as const;

  const pmTab = (active: boolean) =>
    ({
      padding: "8px 14px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-jetbrains), monospace",
      fontSize: "12px",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      background: active ? C.bgHighlight : "transparent",
      color: active ? C.fg : C.fgMuted,
      boxShadow: active ? `inset 0 -2px 0 ${C.accentBright}` : "none",
    }) as const;

  const agentTab = (active: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 14px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-jetbrains), monospace",
      fontSize: "12px",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      background: active ? C.bgHighlight : "transparent",
      color: active ? C.fg : C.fgMuted,
      boxShadow: active ? `inset 0 -2px 0 ${C.accentBright}` : "none",
    }) as const;

  return (
    <div id="install" style={{ marginTop: "48px", width: "100%" }}>
      <div
        style={{
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          background: C.bgElevated,
          padding: "24px 22px 22px",
          boxShadow: `0 24px 48px rgba(0,0,0,0.35)`,
        }}
      >
        {/* Title hierarchy */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "22px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.fgMuted,
                margin: "0 0 6px 0",
              }}
            >
              Agent Insights
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "clamp(18px, 2.5vw, 22px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: C.fg,
                lineHeight: 1.2,
              }}
            >
              Install
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.5, color: C.fgMuted, maxWidth: "420px" }}>
              {mode === "terminal"
                ? "Run with your package manager to print usage, commands, and flags."
                : "Copy an onboarding prompt for your coding agent."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Install method"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
              borderRadius: "8px",
              background: "#0b0d12",
              border: `1px solid ${C.borderBright}`,
            }}
          >
            <button type="button" style={segBtn(mode === "terminal")} onClick={() => setMode("terminal")}>
              <Terminal size={14} strokeWidth={2} aria-hidden />
              Terminal
            </button>
            <button type="button" style={segBtn(mode === "agent")} onClick={() => setMode("agent")}>
              <Bot size={14} strokeWidth={2} aria-hidden />
              AI Agent
            </button>
          </div>
        </div>

        {/* Secondary tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "14px",
            paddingBottom: "14px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {mode === "terminal" ? (
            (["npx", "yarn", "pnpm", "bun"] as const).map((p) => (
              <button key={p} type="button" style={pmTab(pm === p)} onClick={() => setPm(p)}>
                {p}
              </button>
            ))
          ) : (
            (["claude", "cursor", "opencode", "codex"] as const).map((a) => (
              <button key={a} type="button" style={agentTab(agent === a)} onClick={() => setAgent(a)}>
                <AgentTabIcon agent={a} size={18} />
                {AGENT_LABEL[a]}
              </button>
            ))
          )}
        </div>

        {/* Command / prompt box */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "0",
            background: "#050608",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            overflow: "hidden",
            minHeight: "48px",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "14px 16px",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: "13px",
              color: C.fg,
              display: "flex",
              alignItems: "center",
            }}
          >
            {mode === "terminal" ? (
              <>
                <span style={{ color: C.termGreen, marginRight: "8px" }}>&gt;</span>
                <span style={{ wordBreak: "break-all" }}>{commandLine}</span>
              </>
            ) : (
              <span style={{ color: C.fgMuted }}>
                <span style={{ color: C.termGreen, marginRight: "8px" }}>&gt;</span>
                copy onboarding prompt for {AGENT_LABEL[agent]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={copyText}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            style={{
              flexShrink: 0,
              width: "48px",
              border: "none",
              borderLeft: `1px solid ${C.border}`,
              background: C.bgHighlight,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: copied ? C.termGreen : C.fgMuted,
            }}
          >
            <Copy size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
