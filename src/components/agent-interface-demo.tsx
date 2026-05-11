"use client";

import { useEffect, useMemo, useState } from "react";

/** Matches landing.tsx palette */
const C = {
  bgElevated: "#111318",
  bgHighlight: "#191c23",
  fg: "#e8ecf4",
  fgMuted: "#7a8499",
  accentBright: "#7aa3eb",
  border: "#1e2230",
  termGreen: "#5abf7a",
  termAmber: "#d4a84b",
  termMuted: "#4a5268",
  macRed: "#ff5f57",
  macYellow: "#febc2e",
  macGreen: "#28c840",
} as const;

type Variant = "prompt" | "skill" | "muted" | "result" | "body";

type ScriptLine = {
  text: string;
  variant: Variant;
  pauseAfterMs?: number;
  leadClass?: string;
};

type UseCaseTab = {
  id: string;
  label: string;
  script: ScriptLine[];
};

const USE_CASES: UseCaseTab[] = [
  {
    id: "workspace",
    label: "workspace",
    script: [
      {
        text: "❯ Best fix for this Vercel deploy failure",
        variant: "prompt",
        pauseAfterMs: 200,
      },
      {
        text: "● Codex — agent-insights_search (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'query: "Module not found: Can\'t resolve \'@acme/ui\'"',
        variant: "muted",
        pauseAfterMs: 55,
      },
      {
        text: "context: pnpm 9 · turbo repo · apps/web uses workspace:*",
        variant: "muted",
        pauseAfterMs: 70,
      },
      {
        text: "↳ Found 2 insights (1 team, 1 public)",
        variant: "result",
        pauseAfterMs: 130,
      },
      {
        text: "● Codex — agent-insights_read (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'insight: "pnpm workspace — internal package not linked"',
        variant: "muted",
        pauseAfterMs: 75,
      },
      {
        text: "↳ 512 chars",
        variant: "result",
        pauseAfterMs: 110,
      },
      {
        text:
          "Root cause: packages/ui exists under packages/ but pnpm-workspace.yaml only listed apps/*. The workspace protocol never linked @acme/ui. Add `packages/*` to `pnpm-workspace.yaml`, run pnpm install, restart the dev server — then `workspace:*` resolves and the deploy build passes.",
        variant: "body",
        pauseAfterMs: 900,
      },
    ],
  },
  {
    id: "edge",
    label: "edge",
    script: [
      {
        text: "❯ Why does Auth.js crash when I deploy to Vercel Edge?",
        variant: "prompt",
        pauseAfterMs: 200,
      },
      {
        text: "● Cursor — agent-insights_search (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'query: "crypto.subtle unavailable Edge Runtime Next.js"',
        variant: "muted",
        pauseAfterMs: 55,
      },
      {
        text: "context: Next.js 14 · Edge · @auth/core signing JWTs",
        variant: "muted",
        pauseAfterMs: 70,
      },
      {
        text: "↳ Found 3 insights",
        variant: "result",
        pauseAfterMs: 130,
      },
      {
        text: "● Cursor — agent-insights_read (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'insight: "Next.js Edge: crypto.subtle vs node:crypto"',
        variant: "muted",
        pauseAfterMs: 75,
      },
      {
        text: "↳ 398 chars",
        variant: "result",
        pauseAfterMs: 110,
      },
      {
        text:
          "Edge bundles omit Node polyfills: `node:crypto` throws. Use `globalThis.crypto.subtle` (Web Crypto) for JWT operations and drop imports that assume a Node process. Restart dev after changing middleware runtime.",
        variant: "body",
        pauseAfterMs: 900,
      },
    ],
  },
  {
    id: "ci",
    label: "ci",
    script: [
      {
        text: '❯ Unblock CI: "fatal: Need to specify how to reconcile diverging branches"',
        variant: "prompt",
        pauseAfterMs: 200,
      },
      {
        text: "● Codex — agent-insights_search (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'query: "git pull diverging branches github actions"',
        variant: "muted",
        pauseAfterMs: 55,
      },
      {
        text: "context: ubuntu-latest · actions/checkout@v4 · protected main",
        variant: "muted",
        pauseAfterMs: 70,
      },
      {
        text: "↳ Found 2 insights",
        variant: "result",
        pauseAfterMs: 130,
      },
      {
        text: "● Codex — agent-insights_read (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'insight: "CI git pull — divergent branches default refuse"',
        variant: "muted",
        pauseAfterMs: 75,
      },
      {
        text: "↳ 441 chars",
        variant: "result",
        pauseAfterMs: 110,
      },
      {
        text:
          "Checkout uses merge pulls that hit divergent history. Prefer `git pull --rebase` or set `git config pull.rebase true` for the bot identity, or merge explicitly once on main. Match what your branch protection expects.",
        variant: "body",
        pauseAfterMs: 900,
      },
    ],
  },
  {
    id: "deps",
    label: "deps",
    script: [
      {
        text: "❯ npm install fails after bumping React — peer dependency conflict",
        variant: "prompt",
        pauseAfterMs: 200,
      },
      {
        text: "● Claude — agent-insights_search (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'query: "ERESOLVE peer react 19 radix-ui overlapping"',
        variant: "muted",
        pauseAfterMs: 55,
      },
      {
        text: "context: npm 10 · React 19 · design-system workspace",
        variant: "muted",
        pauseAfterMs: 70,
      },
      {
        text: "↳ Found 2 insights (team)",
        variant: "result",
        pauseAfterMs: 130,
      },
      {
        text: "● Claude — agent-insights_read (skill)",
        variant: "skill",
        pauseAfterMs: 90,
        leadClass: "mt-2",
      },
      {
        text: 'insight: "Peer deps — align react and react-dom majors"',
        variant: "muted",
        pauseAfterMs: 75,
      },
      {
        text: "↳ 356 chars",
        variant: "result",
        pauseAfterMs: 110,
      },
      {
        text:
          "Pin `react` and `react-dom` to the same semver range across the tree. Upgrade Radix and other peers that declare React 18 caps, or use `overrides` temporarily — then dedupe with `npm ls react` until one copy wins.",
        variant: "body",
        pauseAfterMs: 900,
      },
    ],
  },
];

const TICK_MS = 16;
const LOOP_GAP_MS = 3200;

function msToTicks(ms: number) {
  return Math.max(1, Math.round(ms / TICK_MS));
}

function charsPerBurst(row: ScriptLine) {
  return row.variant === "body" ? 2 : 1;
}

function variantColor(v: Variant): string {
  switch (v) {
    case "muted":
      return C.fgMuted;
    default:
      return C.fg;
  }
}

function TerminalChrome({
  children,
  title,
  footer,
  headerRight,
}: {
  children: React.ReactNode;
  title: string;
  footer: React.ReactNode;
  headerRight: React.ReactNode;
}) {
  return (
    <div
      className="agent-interface-demo rounded-lg overflow-hidden border"
      style={{
        background: C.bgElevated,
        borderColor: C.border,
        boxShadow: "0 28px 56px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="relative flex items-center gap-3 px-3.5 py-2.5 border-b min-h-[40px]"
        style={{ background: C.bgHighlight, borderColor: C.border }}
      >
        <div className="flex shrink-0 items-center gap-2">
          <span className="size-3 rounded-full shrink-0" style={{ background: C.macRed }} title="Close" />
          <span className="size-3 rounded-full shrink-0" style={{ background: C.macYellow }} title="Minimize" />
          <span className="size-3 rounded-full shrink-0" style={{ background: C.macGreen }} title="Zoom" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-[12px] font-mono tracking-tight" style={{ color: C.fgMuted }}>
            {title}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center">{headerRight}</div>
      </div>
      <div className="px-5 py-[18px] overflow-hidden" style={{ height: "340px" }}>{children}</div>
      {footer}
    </div>
  );
}

function renderPromptSlice(slice: string) {
  if (!slice.startsWith("❯")) {
    return <span style={{ color: C.fg }}>{slice}</span>;
  }
  const rest = slice.slice(1);
  return (
    <>
      <span style={{ color: C.termGreen }}>❯</span>
      <span style={{ color: C.fg }}>{rest}</span>
    </>
  );
}

function renderSkillSlice(slice: string) {
  const bullet = "●";
  if (!slice.startsWith(bullet)) {
    return <span style={{ color: C.fg }}>{slice}</span>;
  }
  const after = slice.slice(bullet.length);
  return (
    <>
      <span style={{ color: C.accentBright }}>●</span>
      <span style={{ color: C.fg }}>{after}</span>
    </>
  );
}

function renderResultSlice(slice: string) {
  if (!slice.startsWith("↳")) {
    return <span style={{ color: C.fg }}>{slice}</span>;
  }
  const after = slice.slice(1);
  return (
    <>
      <span style={{ color: C.termMuted }}>↳</span>
      <span style={{ color: C.fg }}>{after}</span>
    </>
  );
}

function renderBodySlice(slice: string) {
  const parts = slice.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <span key={i} style={{ color: C.termAmber }}>
          {part}
        </span>
      );
    }
    return (
      <span key={i} style={{ color: C.fg }}>
        {part}
      </span>
    );
  });
}

function StreamedLine({
  full,
  visibleLen,
  variant,
  leadClass,
  showCaret,
}: {
  full: string;
  visibleLen: number;
  variant: Variant;
  leadClass?: string;
  showCaret?: boolean;
}) {
  const slice = full.slice(0, visibleLen);
  const color = variantColor(variant);

  let inner: React.ReactNode = slice;
  if (variant === "prompt") inner = renderPromptSlice(slice);
  else if (variant === "skill") inner = renderSkillSlice(slice);
  else if (variant === "result") inner = renderResultSlice(slice);
  else if (variant === "body") inner = renderBodySlice(slice);
  else inner = <span style={{ color }}>{slice}</span>;

  return (
    <div
      className={`font-mono text-[12.5px] leading-[1.85] whitespace-pre-wrap ${leadClass ?? ""}`}
      style={{ color }}
    >
      {inner}
      {showCaret ? (
        <span className="agent-interface-demo__caret align-middle ml-px" aria-hidden />
      ) : null}
    </div>
  );
}

export function AgentInterfaceDemo() {
  const [activeCaseId, setActiveCaseId] = useState(USE_CASES[0]!.id);
  const [cycle, setCycle] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [col, setCol] = useState(0);
  const [pauseTicks, setPauseTicks] = useState(0);
  const [streamDone, setStreamDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const script = useMemo(
    () => USE_CASES.find((u) => u.id === activeCaseId)?.script ?? USE_CASES[0]!.script,
    [activeCaseId]
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    setLineIndex(0);
    setCol(0);
    setPauseTicks(0);
    setStreamDone(false);
  }, [cycle, activeCaseId]);

  useEffect(() => {
    if (reducedMotion) {
      setLineIndex(script.length);
      setCol(0);
      setPauseTicks(0);
      setStreamDone(true);
      return;
    }

    let line = 0;
    let col = 0;
    let pause = 0;

    const emit = () => {
      setLineIndex(line);
      setCol(col);
      setPauseTicks(pause);
    };

    const id = window.setInterval(() => {
      if (pause > 0) {
        pause -= 1;
        if (pause === 0) {
          if (line >= script.length - 1) {
            setStreamDone(true);
            window.clearInterval(id);
            emit();
            return;
          }
          line += 1;
          col = 0;
        }
        emit();
        return;
      }

      const row = script[line];
      if (!row) {
        setStreamDone(true);
        window.clearInterval(id);
        return;
      }

      const burst = charsPerBurst(row);
      const len = row.text.length;

      if (col < len) {
        col = Math.min(len, col + burst);
        emit();
        return;
      }

      pause = msToTicks(row.pauseAfterMs ?? 60);
      emit();
    }, TICK_MS);

    emit();
    return () => window.clearInterval(id);
  }, [cycle, reducedMotion, script]);

  useEffect(() => {
    if (!streamDone || reducedMotion) return;
    const t = window.setTimeout(() => setCycle((x) => x + 1), LOOP_GAP_MS);
    return () => window.clearTimeout(t);
  }, [streamDone, reducedMotion]);

  const currentRow = script[lineIndex];
  const activelyTyping =
    !reducedMotion &&
    !streamDone &&
    pauseTicks === 0 &&
    currentRow !== undefined &&
    col < currentRow.text.length;

  const rerun = () => setCycle((x) => x + 1);

  const footer = (
    <div className="border-t px-3 py-2.5 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: C.border, background: C.bgElevated }}>
      <div className="flex flex-wrap items-center gap-1">
        {USE_CASES.map((uc) => {
          const active = uc.id === activeCaseId;
          return (
            <button
              key={uc.id}
              type="button"
              onClick={() => {
                setActiveCaseId(uc.id);
                setCycle((c) => c + 1);
              }}
              className="rounded px-2.5 py-1 font-mono text-[11px] transition-colors"
              style={{
                color: active ? C.fg : C.fgMuted,
                background: active ? "rgba(89, 128, 212, 0.12)" : "transparent",
              }}
            >
              {uc.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const rerunButton = (
    <button
      type="button"
      onClick={rerun}
      className="rounded px-2 py-1 font-mono text-[11px] transition-opacity hover:opacity-80"
      style={{ color: C.fgMuted, opacity: 0.45 }}
      aria-label="Replay demo animation"
    >
      rerun
    </button>
  );

  return (
    <TerminalChrome title="agent-insights" footer={footer} headerRight={rerunButton}>
      <div className="flex flex-col gap-0">
        {script.map((rowDef, i) => {
          if (reducedMotion) {
            return (
              <StreamedLine
                key={`${cycle}-${activeCaseId}-${i}`}
                full={rowDef.text}
                visibleLen={rowDef.text.length}
                variant={rowDef.variant}
                leadClass={rowDef.leadClass}
              />
            );
          }

          const past = i < lineIndex;
          const current = i === lineIndex;
          if (!past && !current) return null;

          const visibleLen = past ? rowDef.text.length : col;
          if (!past && visibleLen === 0) return null;

          return (
            <StreamedLine
              key={`${cycle}-${activeCaseId}-${i}`}
              full={rowDef.text}
              visibleLen={visibleLen}
              variant={rowDef.variant}
              leadClass={rowDef.leadClass}
              showCaret={activelyTyping && current}
            />
          );
        })}
      </div>
    </TerminalChrome>
  );
}
