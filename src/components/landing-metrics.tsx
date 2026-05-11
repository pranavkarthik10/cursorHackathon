"use client";

import Link from "next/link";
import { useState } from "react";

const M = {
  bg: "#0b0d12",
  bgElevated: "#111318",
  bgPanel: "#0d0f14",
  fg: "#ffffff",
  fgMuted: "#8b93a7",
  fgDim: "#5c6578",
  accent: "#5980d4",
  accentBright: "#7aa3eb",
  termGreen: "#5abf7a",
  border: "#1e2230",
  barMuted: "#2c3240",
} as const;

/** Same five resolution paths; values are illustrative per metric. */
const PATH_LABELS = [
  { id: "insights", label: "Agent Insights", primary: true as const },
  { id: "agent", label: "Agent only", primary: false as const },
  { id: "web", label: "Docs + agent", primary: false as const },
  { id: "slack", label: "Slack thread", primary: false as const },
  { id: "ticket", label: "Filed a ticket", primary: false as const },
] as const;

type MetricId = "time" | "token" | "energy";

type MetricTheme = {
  accent: string;
  accentDeep: string;
  accentGlow: string;
  barMuted: string;
  barMutedHi: string;
  chartBgTop: string;
  chartBgBot: string;
};

const METRIC_THEMES: Record<MetricId, MetricTheme> = {
  time: {
    accent: "#7aa3eb",
    accentDeep: "#4a6fc4",
    accentGlow: "rgba(122, 163, 235, 0.45)",
    barMuted: "#2a3142",
    barMutedHi: "#3d465c",
    chartBgTop: "rgba(89, 128, 212, 0.06)",
    chartBgBot: "rgba(11, 13, 18, 0)",
  },
  token: {
    accent: "#e8b84a",
    accentDeep: "#b8892a",
    accentGlow: "rgba(232, 184, 74, 0.42)",
    barMuted: "#353228",
    barMutedHi: "#4a4330",
    chartBgTop: "rgba(232, 184, 74, 0.07)",
    chartBgBot: "rgba(11, 13, 18, 0)",
  },
  energy: {
    accent: "#5abf9a",
    accentDeep: "#2d8f6e",
    accentGlow: "rgba(90, 191, 154, 0.45)",
    barMuted: "#283632",
    barMutedHi: "#364a42",
    chartBgTop: "rgba(90, 191, 154, 0.07)",
    chartBgBot: "rgba(11, 13, 18, 0)",
  },
};

const METRICS: Record<
  MetricId,
  {
    tab: string;
    title: string;
    subtitle: string;
    footer: string;
    max: number;
    ticks: number[];
    formatTick: (n: number) => string;
    formatValue: (n: number) => string;
    aria: string;
    /** Parallel to PATH_LABELS */
    values: readonly number[];
  }
> = {
  time: {
    tab: "Time",
    title: "Hours to fix · same bug, five paths",
    subtitle: "repro → verified fix · lower is better",
    footer: "Agent Insights — a matching card before the debug loop starts",
    max: 20,
    ticks: [0, 5, 10, 15, 20],
    formatTick: (t) => `${t}h`,
    formatValue: (v) => `${v}h`,
    aria:
      "Bar chart: hours to fix. Agent Insights about 3.4 hours; agent only 14.2; docs plus agent 11; Slack 9.5; ticket 17.8.",
    values: [3.4, 14.2, 11.0, 9.5, 17.8],
  },
  token: {
    tab: "Tokens",
    title: "Estimated tokens · same bug, five paths",
    subtitle: "retrieve → apply → verify · lower uses less model compute",
    footer: "Agent Insights — retrieval cuts exploratory tool and retry loops",
    max: 120,
    ticks: [0, 30, 60, 90, 120],
    formatTick: (t) => (t === 0 ? "0" : `${t}k`),
    formatValue: (v) =>
      Number.isInteger(v) ? `~${v}k` : `~${v.toFixed(1)}k`,
    aria:
      "Bar chart: thousands of tokens per path. Agent Insights about 8.1k; Slack thread about 21k; filed ticket about 35k; docs plus agent about 47k; agent only about 118k.",
    /** Illustrative: insight path is a short retrieval + patch loop; agent-only is long tool-heavy debugging. */
    values: [8.1, 118, 47, 21, 35],
  },
  energy: {
    tab: "Energy",
    title: "Illustrative session energy · same bug, five paths",
    subtitle: "proxy for GPU inference · lower is leaner",
    footer: "Agent Insights — fewer rounds means less datacenter draw (illustrative)",
    max: 110,
    ticks: [0, 25, 50, 75, 100],
    formatTick: (t) => (t === 0 ? "0" : `${t}`),
    formatValue: (v) => `${v} Wh`,
    aria:
      "Bar chart: illustrative watt-hours per path. Agent Insights 9 Wh; Slack thread 17 Wh; filed ticket 33 Wh; docs plus agent 44 Wh; agent only 102 Wh.",
    /** Same narrative as tokens: long autonomous sessions dominate draw; human-heavy paths use fewer model passes. */
    values: [9, 102, 44, 17, 33],
  },
};

const TIME_STATS = [
  { stat: "3.4h",  caption: "With Agent Insights",   sub: "Insight matched — fix retrieved early" },
  { stat: "14.2h", caption: "Agent only, cold start", sub: "No matching card in catalog" },
  { stat: "~76%",  caption: "Less time",              sub: "Illustrative delta, not a guarantee" },
];

const TOKEN_STATS = [
  { stat: "~8k", caption: "Tokens, with insights", sub: "Short retrieval + patch loop (illustrative)" },
  { stat: "~118k", caption: "Tokens, agent-only marathon", sub: "Long tool-heavy debugging with no catalog hit" },
  { stat: "~93%", caption: "Fewer tokens", sub: "Illustrative vs agent-only bar on this benchmark" },
];

function StatGroup({ label, stats }: { label: string; stats: typeof TIME_STATS }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: M.fgDim,
          marginBottom: "10px",
          paddingLeft: "20px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          border: `1px solid ${M.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          background: M.bgPanel,
          fontFamily: "var(--font-jetbrains), monospace",
        }}
      >
        {stats.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "18px 20px",
              borderLeft: i > 0 ? `1px solid ${M.border}` : "none",
            }}
          >
            <div
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 700,
                color: i === 2 ? M.termGreen : M.fg,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              {c.stat}
            </div>
            <div style={{ marginTop: "8px", fontSize: "12px", color: M.fgMuted, lineHeight: 1.4 }}>{c.caption}</div>
            <div style={{ marginTop: "4px", fontSize: "10px", color: M.fgDim, lineHeight: 1.4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkChart({ metricId }: { metricId: MetricId }) {
  const cfg = METRICS[metricId];
  const theme = METRIC_THEMES[metricId];
  const w = 640;
  const h = 268;
  const pad = { l: 52, r: 22, t: 36, b: 52 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = PATH_LABELS.length;
  const gap = 12;
  const barW = (innerW - gap * (n - 1)) / n;
  const gid = `bench-${metricId}`;
  const max = cfg.max;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      role="img"
      aria-label={cfg.aria}
    >
      <defs>
        <linearGradient id={`${gid}-chart-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.chartBgTop} />
          <stop offset="100%" stopColor={theme.chartBgBot} />
        </linearGradient>
        <linearGradient id={`${gid}-muted`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.barMutedHi} />
          <stop offset="100%" stopColor={theme.barMuted} />
        </linearGradient>
        <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.accentGlow} floodOpacity={1} />
        </filter>
        <filter id={`${gid}-glow-soft`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={theme.accent} floodOpacity={0.35} />
        </filter>
      </defs>

      <rect x={pad.l - 8} y={pad.t - 6} width={w - pad.l - pad.r + 16} height={innerH + 14} rx={6} fill={`url(#${gid}-chart-bg)`} stroke={M.border} strokeOpacity={0.65} />

      {cfg.ticks.map((tick) => {
        const y = pad.t + innerH - (tick / max) * innerH;
        const isBase = tick === 0;
        return (
          <g key={tick}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke={isBase ? theme.accent : M.border}
              strokeOpacity={isBase ? 0.35 : 0.55}
              strokeWidth={isBase ? 1.2 : 1}
              strokeDasharray={isBase ? "0" : "4 6"}
            />
            <text
              x={pad.l - 10}
              y={y + 4}
              fill={M.fgDim}
              fontSize={10}
              fontFamily="var(--font-jetbrains), monospace"
              textAnchor="end"
            >
              {cfg.formatTick(tick)}
            </text>
          </g>
        );
      })}

      {PATH_LABELS.map((b, i) => {
        const raw = cfg.values[i]!;
        const bh = (raw / max) * innerH;
        const x = pad.l + i * (barW + gap);
        const y = pad.t + innerH - bh;
        const isHi = b.primary;
        const isHover = hovered === i;
        const cx = x + barW / 2;
        const labelY = pad.t + innerH + 14;
        const dimOthers = hovered !== null && !isHover && !isHi;
        const fillOpacity = isHi ? 1 : dimOthers ? 0.28 : hovered === null ? 0.92 : isHover ? 1 : 0.42;

        return (
          <g
            key={b.id}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          >
            <rect
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx={4}
              fill={isHi ? theme.accent : `url(#${gid}-muted)`}
              fillOpacity={fillOpacity}
              stroke={isHi ? theme.accent : M.border}
              strokeOpacity={isHi ? 0.55 : 0.5}
              strokeWidth={isHi ? 1.25 : 1}
              filter={isHi ? `url(#${gid}-glow)` : isHover ? `url(#${gid}-glow-soft)` : undefined}
            />
            {isHi && bh > 6 && (
              <line
                x1={x + 2}
                y1={y + 3}
                x2={x + barW - 2}
                y2={y + 3}
                stroke="#ffffff"
                strokeOpacity={0.22}
                strokeWidth={1}
                strokeLinecap="round"
              />
            )}
            {(isHi || isHover) && (
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={cx - 28}
                  y={y - 26}
                  width={56}
                  height={19}
                  rx={4}
                  fill={isHi ? theme.accent : "#f0f3fa"}
                  filter={isHi ? `url(#${gid}-glow-soft)` : undefined}
                />
                <text
                  x={cx}
                  y={y - 11}
                  fill={isHi ? "#0b0d12" : "#0b0d12"}
                  fontSize={10}
                  fontFamily="var(--font-jetbrains), monospace"
                  fontWeight={700}
                  textAnchor="middle"
                >
                  {cfg.formatValue(raw)}
                </text>
              </g>
            )}
            <text
              fill={isHi ? theme.accent : M.fgDim}
              fillOpacity={isHi ? 1 : dimOthers ? 0.45 : 0.95}
              fontSize={9.5}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={isHi ? 600 : 400}
              textAnchor="middle"
              style={{ pointerEvents: "none" }}
            >
              {b.label.split(" ").map((word, wi) => (
                <tspan key={wi} x={cx} y={labelY + wi * 11}>
                  {word}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Illustrative org rollouts — not measured or guaranteed. */
const ENTERPRISE_TIERS = [
  {
    id: "e25",
    short: "25k",
    label: "25k",
    detail: "mid-size product org",
    baselineTokensB: 20,
    catalogTokensB: 7.5,
    valueAnnualM: 18,
  },
  {
    id: "e100",
    short: "100k",
    label: "100k",
    detail: "large enterprise",
    baselineTokensB: 80,
    catalogTokensB: 30,
    valueAnnualM: 71,
  },
  {
    id: "e400",
    short: "400k",
    label: "400k",
    detail: "hyperscale agent program",
    baselineTokensB: 315,
    catalogTokensB: 118,
    valueAnnualM: 280,
  },
] as const;

const ENT_TOK_MAX = 320;
const ENT_TOK_TICKS = [0, 80, 160, 240, 320] as const;
const ENT_VAL_MAX = 300;
const ENT_VAL_TICKS = [0, 75, 150, 225, 300] as const;

function EnterpriseThroughputChart() {
  const w = 520;
  const h = 248;
  const pad = { l: 44, r: 18, t: 30, b: 56 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = ENTERPRISE_TIERS.length;
  const groupGap = 20;
  const groupW = (innerW - groupGap * (n - 1)) / n;
  const barGap = 5;
  const barW = (groupW - barGap) / 2;
  const [hovered, setHovered] = useState<{ g: number; s: 0 | 1 } | null>(null);
  const maxY = ENT_TOK_MAX;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      role="img"
      aria-label="Grouped bars: monthly token volume in billions for 25k, 100k, and 400k seat tiers. For each tier, baseline agent usage is higher than with an insight catalog."
    >
      <defs>
        <linearGradient id="ent-tok-muted" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={M.barMuted} />
          <stop offset="100%" stopColor="#1a1f2a" />
        </linearGradient>
        <filter id="ent-tok-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(122, 163, 235, 0.4)" />
        </filter>
      </defs>
      <text
        x={pad.l}
        y={18}
        fill={M.fgDim}
        fontSize={9}
        fontFamily="var(--font-jetbrains), monospace"
        style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
      >
        Billions of tokens / month
      </text>
      {ENT_TOK_TICKS.map((tick) => {
        const y = pad.t + innerH - (tick / maxY) * innerH;
        const isBase = tick === 0;
        return (
          <g key={tick}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke={isBase ? M.accentBright : M.border}
              strokeOpacity={isBase ? 0.3 : 0.5}
              strokeWidth={1}
              strokeDasharray={isBase ? "0" : "4 6"}
            />
            <text
              x={pad.l - 8}
              y={y + 4}
              fill={M.fgDim}
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              textAnchor="end"
            >
              {tick === 0 ? "0" : tick}
            </text>
          </g>
        );
      })}
      {ENTERPRISE_TIERS.map((tier, gi) => {
        const gx = pad.l + gi * (groupW + groupGap);
        const baselineH = (tier.baselineTokensB / maxY) * innerH;
        const catalogH = (tier.catalogTokensB / maxY) * innerH;
        const y0 = pad.t + innerH;
        const rows: { s: 0 | 1; h: number; x: number; val: number; label: string }[] = [
          { s: 0, h: baselineH, x: gx, val: tier.baselineTokensB, label: "Baseline" },
          { s: 1, h: catalogH, x: gx + barW + barGap, val: tier.catalogTokensB, label: "With catalog" },
        ];
        return (
          <g key={tier.id}>
            {rows.map((row) => {
              const y = y0 - row.h;
              const dim = hovered !== null && !(hovered.g === gi && hovered.s === row.s);
              return (
                <g
                  key={row.s}
                  onMouseEnter={() => setHovered({ g: gi, s: row.s })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "default" }}
                >
                  <rect
                    x={row.x}
                    y={y}
                    width={barW}
                    height={row.h}
                    rx={4}
                    fill={row.s === 0 ? "url(#ent-tok-muted)" : M.accentBright}
                    fillOpacity={dim ? (row.s === 1 ? 0.4 : 0.32) : row.s === 1 ? 1 : 0.95}
                    stroke={row.s === 1 ? M.accentBright : M.border}
                    strokeOpacity={row.s === 1 ? 0.45 : 0.55}
                    strokeWidth={row.s === 1 ? 1.2 : 1}
                    filter={row.s === 1 ? "url(#ent-tok-glow)" : undefined}
                  />
                  {row.h > 14 && (
                    <text
                      x={row.x + barW / 2}
                      y={y - 6}
                      fill={row.s === 1 ? M.accentBright : M.fgMuted}
                      fontSize={9}
                      fontFamily="var(--font-jetbrains), monospace"
                      fontWeight={600}
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {row.val}B
                    </text>
                  )}
                </g>
              );
            })}
            <text
              x={gx + groupW / 2}
              y={y0 + 18}
              fill={M.fg}
              fontSize={11}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={600}
              textAnchor="middle"
            >
              {tier.label}
            </text>
            <text
              x={gx + groupW / 2}
              y={y0 + 32}
              fill={M.fgDim}
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              textAnchor="middle"
            >
              seats · mo
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function EnterpriseValueCaptureChart() {
  const w = 520;
  const h = 220;
  const pad = { l: 44, r: 18, t: 30, b: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = ENTERPRISE_TIERS.length;
  const gap = 18;
  const barW = (innerW - gap * (n - 1)) / n;
  const maxY = ENT_VAL_MAX;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      role="img"
      aria-label="Bars showing illustrative annual value captured in millions of dollars for 25k, 100k, and 400k seat tiers."
    >
      <defs>
        <linearGradient id="ent-val-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6fd99a" />
          <stop offset="100%" stopColor="#2d8f5e" />
        </linearGradient>
        <filter id="ent-val-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(90, 191, 122, 0.35)" />
        </filter>
      </defs>
      <text
        x={pad.l}
        y={18}
        fill={M.fgDim}
        fontSize={9}
        fontFamily="var(--font-jetbrains), monospace"
        style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
      >
        Annual value captured ($M)
      </text>
      {ENT_VAL_TICKS.map((tick) => {
        const y = pad.t + innerH - (tick / maxY) * innerH;
        const isBase = tick === 0;
        return (
          <g key={tick}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke={isBase ? M.termGreen : M.border}
              strokeOpacity={isBase ? 0.35 : 0.45}
              strokeWidth={1}
              strokeDasharray={isBase ? "0" : "4 6"}
            />
            <text
              x={pad.l - 8}
              y={y + 4}
              fill={M.fgDim}
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              textAnchor="end"
            >
              {tick === 0 ? "$0" : `$${tick}M`}
            </text>
          </g>
        );
      })}
      {ENTERPRISE_TIERS.map((tier, i) => {
        const bh = (tier.valueAnnualM / maxY) * innerH;
        const x = pad.l + i * (barW + gap);
        const y = pad.t + innerH - bh;
        const cx = x + barW / 2;
        const isHov = hovered === i;
        const dimOthers = hovered !== null && !isHov;
        return (
          <g
            key={tier.id}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          >
            <rect
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx={5}
              fill="url(#ent-val-grad)"
              fillOpacity={dimOthers ? 0.35 : 1}
              stroke={M.termGreen}
              strokeOpacity={0.5}
              strokeWidth={1.2}
              filter="url(#ent-val-glow)"
            />
            <text
              x={cx}
              y={y - 8}
              fill={M.termGreen}
              fontSize={11}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={700}
              textAnchor="middle"
              style={{ pointerEvents: "none" }}
            >
              ${tier.valueAnnualM}M
            </text>
            <text
              x={cx}
              y={pad.t + innerH + 18}
              fill={M.fg}
              fontSize={11}
              fontFamily="var(--font-jetbrains), monospace"
              fontWeight={600}
              textAnchor="middle"
            >
              {tier.label}
            </text>
            <text
              x={cx}
              y={pad.t + innerH + 32}
              fill={M.fgDim}
              fontSize={9}
              fontFamily="var(--font-jetbrains), monospace"
              textAnchor="middle"
            >
              seats
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LandingMetricsSection() {
  const [metric, setMetric] = useState<MetricId>("time");
  const cfg = METRICS[metric];
  const theme = METRIC_THEMES[metric];
  return (
    <section
      id="impact"
      style={{
        borderTop: `1px solid ${M.border}`,
        borderBottom: `1px solid ${M.border}`,
        background: M.bgElevated,
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 28px" }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: M.accent,
            marginBottom: "12px",
          }}
        >
          // impact · illustrative
        </p>
        <h2
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "clamp(22px, 3vw, 34px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: M.fg,
            margin: "0 0 32px 0",
            lineHeight: 1.15,
          }}
        >
          Retrieve a fix in minutes.<br />
          <span
            style={{
              position: "relative",
              display: "inline-block",
              color: M.fgMuted,
              fontWeight: 500,
            }}
          >
            Debug blind for hours.
            <svg
              aria-hidden
              viewBox="0 0 340 24"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                left: "-2%",
                width: "104%",
                height: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              <defs>
                <filter id="pencil-scratch" x="-5%" y="-60%" width="110%" height="220%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.85 0.6" numOctaves="4" seed="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                  <feComposite in="displaced" in2="SourceGraphic" operator="in" />
                </filter>
              </defs>
              <path
                d="M4 13 C40 10 80 15 128 12 C176 9 216 14 264 11 C292 9 316 13 336 11"
                fill="none"
                stroke="#e53935"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#pencil-scratch)"
                opacity={0.9}
              />
            </svg>
          </span>
        </h2>

        {/* Stat rows */}
        <div
          className="stats-groups"
          style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}
        >
          <StatGroup label="Time to fix (hours)" stats={TIME_STATS} />
          <StatGroup label="Token cost per session" stats={TOKEN_STATS} />
        </div>

        {/* Chart */}
        <div
          className="impact-chart-panel"
          style={{
            border: `1px solid ${M.border}`,
            borderRadius: "8px",
            overflow: "hidden",
            background: M.bgPanel,
          }}
        >
          <nav
            className="impact-chart-tabs"
            aria-label="Benchmark metric"
            style={{
              display: "flex",
              gap: "6px",
              padding: "12px 14px",
              borderBottom: `1px solid ${M.border}`,
              background: M.bg,
              overflowX: "auto",
            }}
          >
            {(["time", "token", "energy"] as const).map((id) => {
              const active = metric === id;
              const th = METRIC_THEMES[id];
              const label = METRICS[id].tab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMetric(id)}
                  aria-pressed={active}
                  style={{
                    flex: "1 1 auto",
                    minWidth: "88px",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${active ? th.accent : M.border}`,
                    background: active
                      ? `linear-gradient(180deg, ${th.chartBgTop} 0%, ${M.bgPanel} 100%)`
                      : M.bgPanel,
                    color: active ? th.accent : M.fgMuted,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: "12px",
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: active ? `0 0 20px ${th.accentGlow}` : undefined,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="impact-chart-body" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: M.fg,
                    }}
                  >
                    {cfg.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: "11px",
                      color: M.fgDim,
                      marginLeft: "12px",
                    }}
                  >
                    {cfg.subtitle}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: M.fgDim }}>
                  hover bars
                </span>
              </div>
            </div>

            <BenchmarkChart metricId={metric} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px 14px",
                borderTop: `1px solid ${M.border}`,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentDeep} 100%)`,
                  boxShadow: `0 0 12px ${theme.accentGlow}`,
                  flexShrink: 0,
                }}
                aria-hidden
              />
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: M.fgMuted }}>
                {cfg.footer}
              </span>
            </div>
          </div>
        </div>

        {/* Enterprise */}
        <div
          id="enterprise"
          style={{
            marginTop: "40px",
            padding: "28px 24px",
            borderRadius: "8px",
            border: `1px solid ${M.border}`,
            background: `linear-gradient(135deg, ${M.bg} 0%, ${M.bgElevated} 100%)`,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: M.accent,
              marginBottom: "12px",
            }}
          >
            // enterprise
          </p>
          <h3
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: "clamp(17px, 2vw, 22px)",
              fontWeight: 600,
              color: M.fg,
              margin: "0 0 14px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Private insight catalogs for teams that run agents for real.
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.75, color: M.fgMuted, margin: "0 0 18px 0", maxWidth: "720px" }}>
            Keep insight cards inside your trust boundary: team- and org-level visibility, consent before anything uploads, and the same
            HTTP APIs your agents and automation already use — so search isn&apos;t just an IDE trick.
          </p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 18px",
              fontSize: "14px",
              lineHeight: 1.9,
              color: M.fgMuted,
              maxWidth: "720px",
            }}
          >
            <li>
              <strong style={{ color: M.fg }}>Ship safely:</strong>{" "}
              preview distilled fields before publish; raw transcripts stay off the server by default.
            </li>
            <li>
              <strong style={{ color: M.fg }}>Same surface for bots:</strong>{" "}
              publish and search from CI or internal tools with a bearer token — not only from chat UIs.
            </li>
            <li>
              <strong style={{ color: M.fg }}>Org-sized roadmap:</strong>{" "}
              SSO, audit trails on publish events, usage signals for platform teams running hundreds of agent seats.
            </li>
          </ul>

          <div
            style={{
              marginTop: "28px",
              paddingTop: "24px",
              borderTop: `1px solid ${M.border}`,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: M.accent,
                marginBottom: "8px",
              }}
            >
              // org scale · illustrative
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: M.fgMuted, margin: "0 0 20px 0", maxWidth: "820px" }}>
              At tens or hundreds of thousands of monthly seats, the same retrieval effect compounds: less exploratory inference, fewer escalations,
              faster MTTR. Figures below are a planning model — not measured performance or a commercial quote.
            </p>

            <div className="enterprise-charts-grid" style={{ display: "grid", gap: "20px" }}>
              <div
                style={{
                  border: `1px solid ${M.border}`,
                  borderRadius: "8px",
                  background: M.bgPanel,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "14px 18px 0" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", fontWeight: 600, color: M.fg }}>
                    Token throughput by rollout size
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: M.fgDim, marginTop: "4px", lineHeight: 1.45 }}>
                    Monthly seats · billions of tokens. Baseline = heavy agent usage without a shared catalog; catalog = steady reuse after adoption.
                  </div>
                </div>
                <EnterpriseThroughputChart />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    padding: "10px 18px 14px",
                    borderTop: `1px solid ${M.border}`,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: "10px",
                    color: M.fgMuted,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: M.barMuted }} aria-hidden />
                    Baseline load
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: M.accentBright }} aria-hidden />
                    With insight catalog
                  </span>
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${M.border}`,
                  borderRadius: "8px",
                  background: M.bgPanel,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "14px 18px 0" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", fontWeight: 600, color: M.fg }}>
                    Illustrative annual value captured
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: M.fgDim, marginTop: "4px", lineHeight: 1.45 }}>
                    Composite index (inference avoided, support load, cycle time) in millions USD per year — not GAAP.
                  </div>
                </div>
                <EnterpriseValueCaptureChart />
                <div
                  style={{
                    padding: "10px 18px 14px",
                    borderTop: `1px solid ${M.border}`,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: "10px",
                    color: M.fgDim,
                    lineHeight: 1.55,
                  }}
                >
                  Rounded $M/year at steady-state in the model; real outcomes depend on catalog hit rate, pricing, security review overhead, and how agents are mandated.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "22px" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "38px",
                padding: "0 18px",
                borderRadius: "6px",
                border: `1px solid ${M.border}`,
                background: M.bgElevated,
                color: M.accentBright,
                fontSize: "13px",
                fontFamily: "var(--font-jetbrains), monospace",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Start with your workspace <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .stats-groups {
            flex-direction: row !important;
            align-items: flex-start;
            gap: 20px !important;
          }
          .impact-chart-panel {
            display: flex !important;
            flex-direction: row !important;
            align-items: stretch !important;
          }
          .impact-chart-tabs {
            flex-direction: column !important;
            align-items: stretch !important;
            flex: 0 0 122px !important;
            max-width: 132px;
            border-bottom: none !important;
            border-right: 1px solid ${M.border} !important;
            padding: 14px 10px !important;
            gap: 8px !important;
            overflow-x: visible !important;
            overflow-y: auto;
          }
          .impact-chart-tabs button {
            flex: 0 0 auto !important;
            min-width: 0 !important;
            width: 100% !important;
            text-align: left !important;
          }
          .impact-chart-body {
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
        }
        @media (min-width: 900px) {
          .enterprise-charts-grid {
            grid-template-columns: 1fr 1fr !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </section>
  );
}
