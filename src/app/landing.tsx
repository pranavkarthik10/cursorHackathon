import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentInterfaceDemo } from "@/components/agent-interface-demo";
import { InstallFlow } from "@/components/install-flow";
import { LandingHeaderSearch } from "@/components/landing-header-search";
import { LandingMetricsSection } from "@/components/landing-metrics";
import { UploadPipelineFlow } from "@/components/upload-pipeline-flow";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0d12",
  bgElevated: "#111318",
  bgHighlight: "#191c23",
  fg: "#e8ecf4",
  fgMuted: "#7a8499",
  fgDim: "#3a404e",
  accent: "#5980d4",
  accentBright: "#7aa3eb",
  accentGlow: "rgba(89, 128, 212, 0.12)",
  border: "#1e2230",
  borderBright: "#2a3048",
  termGreen: "#5abf7a",
  termBlue: "#7aa3eb",
  termAmber: "#c4953a",
  termMuted: "#4a5268",
} as const;

// ─── Terminal window ──────────────────────────────────────────────────────────
function TerminalWindow({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ background: C.bgHighlight, borderBottom: `1px solid ${C.border}`, padding: "9px 14px", display: "flex", alignItems: "center", gap: "7px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2a2030", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#252830", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1e2830", display: "inline-block" }} />
        {title && <span style={{ marginLeft: "auto", fontSize: "11px", color: C.termMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{title}</span>}
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function T({ c, children }: { c?: string; children: React.ReactNode }) {
  return <span style={{ color: c }}>{children}</span>;
}

function TL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12.5px", lineHeight: "1.8", color: C.fg, whiteSpace: "pre" }}>
      {children}
    </div>
  );
}

function TBlank() { return <div style={{ height: "0.4em" }} />; }

// ─── Search terminal ──────────────────────────────────────────────────────────
function SearchTerminal() {
  return (
    <TerminalWindow title="zsh - ~/projects/myapp">
      <TL><T c={C.termGreen}>❯</T><T c={C.fg}> npx agent-insights search &quot;crypto Edge Runtime Next.js&quot;</T></TL>
      <TBlank />
      <TL><T c={C.termMuted}>  Found 2 insights</T></TL>
      <TBlank />
      <TL><T c={C.termGreen}>■ High match</T></TL>
      <TL><T c={C.fg}>  Next.js Edge: crypto.subtle unavailable</T></TL>
      <TL><T c={C.termMuted}>  Next.js 14.2 · Vercel Edge Runtime</T></TL>
      <TL><T c={C.termMuted}>  Fix: Use globalThis.crypto.subtle (Web Crypto API)</T></TL>
      <TBlank />
      <TL><T c={C.termAmber}>■ Medium match</T></TL>
      <TL><T c={C.fg}>  Vercel Edge: TextEncoder not defined</T></TL>
      <TL><T c={C.termMuted}>  Next.js 13.4 · Vercel Edge Runtime</T></TL>
      <TL><T c={C.termMuted}>  Fix: Remove Buffer dependency, use native TextEncoder</T></TL>
    </TerminalWindow>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "0.82em", background: C.bgHighlight, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "0.1em 0.45em", color: C.accentBright }}>
      {children}
    </code>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: "28px" }}>
      // {children}
    </p>
  );
}

function Rule() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>
      <div style={{ borderTop: `1px solid ${C.border}` }} />
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div style={{ background: C.bg, color: C.fg, fontFamily: "var(--font-geist-sans), sans-serif", minHeight: "100svh", position: "relative", isolation: "isolate" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, borderBottom: `1px solid ${C.border}`, background: `${C.bg}f0`, backdropFilter: "blur(12px)" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 28px",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "20px", fontWeight: 500, color: C.accentBright, letterSpacing: "-0.01em" }}>
            agent-insights
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 240px", justifyContent: "flex-end", minWidth: 0 }}>
            <LandingHeaderSearch />
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "34px",
                padding: "0 16px",
                borderRadius: "6px",
                background: C.accent,
                color: "#fff",
                fontSize: "13px",
                fontFamily: "var(--font-jetbrains), monospace",
                textDecoration: "none",
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              sign in <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: C.bg,
        }}
      >
        {/* Subtle dot-grid + blue glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 65% 40%, ${C.accentGlow}, transparent 70%),
              radial-gradient(circle at 20% 80%, rgba(89,128,212,0.05) 0%, transparent 50%)
            `,
            backgroundSize: "100% 100%, 100% 100%",
            pointerEvents: "none",
          }}
        />
        {/* Dot grid overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "88px 28px 80px", position: "relative" }}>
          <div className="hero-grid">
          {/* Left: copy */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "clamp(30px, 5vw, 58px)",
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: C.fg,
                margin: 0,
              }}
            >
              Hard-won fixes,
              <br />
              <span style={{ color: C.accentBright }}>captured and shared.</span>
            </h1>

            <p style={{ marginTop: "24px", fontSize: "16px", lineHeight: 1.7, color: C.fgMuted, maxWidth: "460px" }}>
              Coding-agent sessions are isolated. The next developer who hits the same
              obscure error will spend hours rediscovering the same fix. Agent Insights
              distills solved sessions into searchable cards for you, your team, or the
              whole community.
            </p>

            <div style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
              <Link
                href="/login"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "40px", padding: "0 20px", borderRadius: "6px", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: 500, textDecoration: "none", fontFamily: "var(--font-jetbrains), monospace" }}
              >
                open dashboard <ArrowRight size={13} />
              </Link>
              <a
                href="#install"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "40px", padding: "0 18px", borderRadius: "6px", border: `1px solid ${C.borderBright}`, background: "transparent", color: C.fgMuted, fontSize: "13px", textDecoration: "none", fontFamily: "var(--font-jetbrains), monospace" }}
              >
                install ↓
              </a>
            </div>
          </div>

          {/* Right: agent interface */}
          <div className="hero-terminal">
            <AgentInterfaceDemo />
          </div>
          </div>

          <InstallFlow />
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 28px" }}>
        <Label>how it works</Label>

        <UploadPipelineFlow prominent />

        <div className="how-it-works-steps">
          {(
            [
              {
                n: "01",
                title: "Privacy and preview",
                body: "Ask first, preview the card and visibility, then confirm before any upload.",
                command: null,
              },
              {
                n: "02",
                title: "Publish",
                body: "Uploads to the platform where it ensures security, privacy, and validity are strong before adding to the global registry.",
                command: "npx agent-insights publish",
              },
              {
                n: "03",
                title: "Search and retrieve",
                body: "Search at kickoff or when you are stuck so prior fixes surface before you repeat the same spiral.",
                command: 'npx agent-insights search "git diverging branches abort failure"',
              },
            ] as const
          ).map((step, idx) => (
            <div
              key={idx}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                padding: "22px 18px",
                background: C.bgElevated,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: C.accent,
                  letterSpacing: "0.08em",
                }}
              >
                {step.n} /
              </span>
              <h3 style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.015em", color: C.fg, margin: "10px 0 0" }}>{step.title}</h3>
              <p
                style={{
                  marginTop: "10px",
                  flex: 1,
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: C.fgMuted,
                  minWidth: 0,
                }}
              >
                {step.body}
              </p>
              {step.command ? (
                <div
                  style={{
                    marginTop: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: C.bgHighlight,
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    padding: "9px 14px",
                    alignSelf: "flex-start",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: C.termGreen }}>$</span>
                  <code
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: "11.5px",
                      color: C.fg,
                      wordBreak: "break-all",
                    }}
                  >
                    {step.command}
                  </code>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <Rule />

      <LandingMetricsSection />

      {/* ── SEARCH DEMO ────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 28px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center" }} className="search-grid">
        <div>
          <Label>recall</Label>
          <h2 style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "clamp(22px, 3.2vw, 36px)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.025em", color: C.fg, margin: 0 }}>
            One command to skip<br />
            hours of debugging.
          </h2>
          <p style={{ marginTop: "18px", fontSize: "15px", lineHeight: 1.7, color: C.fgMuted, maxWidth: "380px" }}>
            Hybrid search finds the right fix even when you can only describe the symptom.
            Your agent can run it for you at kickoff or when you are blocked: exact strings,
            keywords, and semantic meaning in one shot.
          </p>
        </div>
        <div className="search-terminal"><SearchTerminal /></div>
      </section>

      <Rule />

      {/* ── AGENT INTEGRATION ──────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 28px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "start" }} className="agent-grid">
        <div>
          <Label>agent integration</Label>
          <h2 style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "clamp(22px, 3.2vw, 36px)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.025em", color: C.fg, margin: 0 }}>
            Built for agents,<br />not just humans.
          </h2>
          <p style={{ marginTop: "18px", fontSize: "15px", lineHeight: 1.7, color: C.fgMuted, maxWidth: "400px" }}>
            Use <strong style={{ color: C.fg, fontWeight: 600 }}>Install → AI Agent</strong> to copy an onboarding prompt for Claude Code, Cursor, OpenCode, or Codex, then add{" "}
            <Code>SKILL.md</Code> yourself; no init script.
          </p>
          <p style={{ marginTop: "12px", fontSize: "15px", lineHeight: 1.7, color: C.fgMuted, maxWidth: "400px" }}>
            Or hit <Code>POST /api/insights/publish</Code> directly: pass a bearer token,
            get a published card. Works from any agent pipeline.
          </p>
        </div>
        <div>
          <TerminalWindow title="SKILL.md">
            <TL><T c={C.termMuted}>---</T></TL>
            <TL><T c={C.accent}>name</T><T c={C.fg}>: agent-insights</T></TL>
            <TL><T c={C.accent}>description</T><T c={C.fg}>: Publish hard-won fixes from</T></TL>
            <TL><T c={C.fg}>  completed coding-agent sessions.</T></TL>
            <TL><T c={C.accent}>triggers</T><T c={C.fg}>:</T></TL>
            <TL><T c={C.fg}>  - resolved a non-trivial error or build failure</T></TL>
            <TL><T c={C.fg}>  - session involved significant debugging</T></TL>
            <TL><T c={C.termMuted}>---</T></TL>
            <TBlank />
            <TL><T c={C.termMuted}># At session end, run:</T></TL>
            <TBlank />
            <TL><T c={C.termGreen}>npx agent-insights publish</T></TL>
          </TerminalWindow>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bgElevated }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "32px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: "14px" }}>// get started</p>
            <h2 style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "clamp(20px, 2.8vw, 30px)", fontWeight: 500, letterSpacing: "-0.025em", color: C.fg, margin: 0 }}>
              Stop rediscovering fixes.
            </h2>
            <p style={{ marginTop: "10px", fontSize: "14px", color: C.fgMuted }}>Sign in with your email. No credit card required.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <Link
              href="/login"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "40px", padding: "0 20px", borderRadius: "6px", background: C.accent, color: "#fff", fontSize: "13px", fontWeight: 500, textDecoration: "none", fontFamily: "var(--font-jetbrains), monospace" }}
            >
              open dashboard <ArrowRight size={13} />
            </Link>
            <a
              href="https://github.com/pranavkarthik10/cursorHackathon"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", height: "40px", padding: "0 16px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: C.fgMuted, fontSize: "13px", textDecoration: "none", fontFamily: "var(--font-jetbrains), monospace" }}
            >
              view on github
            </a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: C.fgDim }}>agent-insights</span>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: C.fgDim }}>consent-first shared memory for coding agents</span>
        </div>
      </footer>

      {/* ── RESPONSIVE ─────────────────────────────────────── */}
      <style>{`
        .hero-grid    { display: grid; grid-template-columns: 1fr; gap: 60px; }
        .search-grid  { display: grid; grid-template-columns: 1fr; gap: 48px; }
        .agent-grid   { display: grid; grid-template-columns: 1fr; gap: 48px; }
        .how-it-works-steps {
          margin-top: 40px;
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
          align-items: stretch;
        }
        @media (min-width: 900px) {
          .hero-grid   { grid-template-columns: 1fr 440px !important; }
          .search-grid { grid-template-columns: 1fr 1fr !important; }
          .agent-grid  { grid-template-columns: 1fr 1fr !important; }
          .how-it-works-steps { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 899px) {
          .hero-terminal { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
