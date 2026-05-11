"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Shield, ShieldCheck, Store, Upload } from "lucide-react";

const C = {
  bgElevated: "#111318",
  bgHighlight: "#191c23",
  fgMuted: "#7a8499",
  fg: "#e8ecf4",
  accent: "#5980d4",
  accentBright: "#7aa3eb",
  border: "#1e2230",
  borderBright: "#2a3048",
  accentGlow: "rgba(89, 128, 212, 0.14)",
  termGreen: "#5abf7a",
  termAmber: "#c4953a",
  fgDim: "#3a404e",
} as const;

const STEP_MS = 3400;

const VERIFIER_LOGOS = [
  { src: "/logos/openai.svg", label: "OpenAI" },
  { src: "/logos/anthropic.svg", label: "Anthropic" },
  { src: "/logos/googlegemini.svg", label: "Gemini" },
] as const;

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  /** Shown in the detail strip while this stage is active. */
  panel: string;
  /** Shown in the hover / focus box for this column. */
  hover: string;
  lucide?: LucideIcon;
  logos?: boolean;
};

const STAGES: readonly Stage[] = [
  {
    id: "upload",
    title: "Upload",
    subtitle: "Multi-step ingest",
    panel:
      "Session or export is distilled into a card layer by layer. Nothing ships until you confirm each step.",
    hover:
      "Layered ingest: distillation, preview, and explicit confirmations before the packet is accepted server-side.",
    lucide: Upload,
  },
  {
    id: "privacy",
    title: "Privacy",
    subtitle: "Redaction",
    panel:
      "Secrets, tokens, emails, and repo paths are masked before preview while the card is still private to you.",
    hover:
      "Automatic redaction for API keys, emails, and path-like strings so previews stay safe to share internally.",
    lucide: Shield,
  },
  {
    id: "security",
    title: "Security",
    subtitle: "Abuse checks",
    panel:
      "We scan for prompt-injection patterns, hidden instructions, and hostile payloads before anything is indexed.",
    hover:
      "Heuristics and classifiers flag jailbreaks, hidden system prompts, and executable-looking content before storage.",
    lucide: ShieldCheck,
  },
  {
    id: "verification",
    title: "Verification",
    subtitle: "Ensemble vote",
    panel:
      "Independent providers score coherence, safety, and usefulness. Ensemble voting decides marketplace eligibility.",
    hover:
      "Multiple models each score the card; aggregated votes gate whether a public listing is allowed.",
    logos: true,
  },
  {
    id: "marketplace",
    title: "Marketplace",
    subtitle: "Go live",
    panel:
      "Cards that clear the vote become searchable. Borderline or rejected items stay team-only or private.",
    hover:
      "Approved cards join the shared index; rejects never appear in public search, only in scopes you control.",
    lucide: Store,
  },
];

const GRID_GAP = 8;

const gridCols = (n: number) =>
  ({
    display: "grid" as const,
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
    gap: GRID_GAP,
    width: "100%" as const,
    boxSizing: "border-box" as const,
  });

type UploadPipelineFlowProps = {
  /** Larger chrome, headline, and glow (use at top of How it works). */
  prominent?: boolean;
};

export function UploadPipelineFlow({ prominent = false }: UploadPipelineFlowProps) {
  const [phase, setPhase] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const prevPhase = useRef(-1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % STAGES.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (prevPhase.current === STAGES.length - 1 && phase === 0) {
      setSkipTransition(true);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setSkipTransition(false));
      });
      prevPhase.current = phase;
      return () => window.cancelAnimationFrame(raf);
    }
    prevPhase.current = phase;
  }, [phase]);

  const motionOn = !reducedMotion;
  const gc = gridCols(STAGES.length);
  const active = STAGES[phase]!;
  const railH = prominent ? 30 : 26;
  const lineY = railH / 2;
  const iconSz = prominent ? 32 : 22;
  const logoBox = prominent ? 32 : 26;
  const logoImg = prominent ? 16 : 15;

  return (
    <div
      className="upload-pipeline-root"
      style={{
        marginTop: prominent ? "10px" : "16px",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: prominent ? "28px 22px 26px" : "22px 18px 20px",
        borderRadius: prominent ? "14px" : "10px",
        border: prominent ? `1px solid ${C.borderBright}` : `1px solid ${C.border}`,
        background: prominent
          ? `linear-gradient(165deg, ${C.bgElevated} 0%, ${C.bgHighlight} 55%, #141822 100%)`
          : `linear-gradient(165deg, ${C.bgElevated} 0%, ${C.bgHighlight} 100%)`,
        boxShadow: prominent
          ? `0 0 0 1px rgba(122, 163, 235, 0.08), 0 0 48px ${C.accentGlow}, 0 24px 48px rgba(0,0,0,0.35)`
          : undefined,
        position: "relative",
      }}
    >
      {prominent ? (
        <>
        </>
      ) : null}

      <div style={{ marginTop: prominent ? "22px" : "18px", position: "relative", width: "100%" }}>
        {/* Icons + titles (hover / focus box per column) */}
        <div role="list" aria-label="Publish pipeline stages" style={{ ...gc, marginBottom: "8px" }}>
          {STAGES.map((stage, i) => {
            const isActive = motionOn && phase === i;
            const isPassed = motionOn && phase > i;
            const tone = isActive ? C.accentBright : isPassed ? C.termGreen : C.fgMuted;
            const Lucide = stage.lucide;
            return (
              <div
                key={stage.id}
                role="listitem"
                className="upload-pipeline-step"
                tabIndex={0}
                style={{
                  position: "relative",
                  textAlign: "center",
                  minWidth: 0,
                  padding: "6px 4px 4px",
                  borderRadius: "8px",
                  outline: "none",
                  transition: "background 0.25s",
                }}
              >
                <div
                  className="upload-pipeline-tip"
                  role="tooltip"
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "100%",
                    transform: "translateX(-50%)",
                    marginBottom: "8px",
                    minWidth: "min(240px, 52vw)",
                    maxWidth: "260px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    lineHeight: 1.45,
                    color: C.fg,
                    textAlign: "left",
                    background: C.bgElevated,
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                    opacity: 0,
                    visibility: "hidden" as const,
                    pointerEvents: "none" as const,
                    zIndex: 30,
                    transition: "opacity 0.15s ease, visibility 0.15s ease",
                  }}
                >
                  {stage.hover}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: prominent ? "44px" : "38px",
                    marginBottom: "6px",
                  }}
                >
                  {stage.logos ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      {VERIFIER_LOGOS.map((logo) => (
                        <span
                          key={logo.src}
                          title={logo.label}
                          className="upload-pipeline-model-logo"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: `${logoBox}px`,
                            height: `${logoBox}px`,
                            borderRadius: "6px",
                            border: `1px solid ${isActive ? `${C.accent}55` : C.border}`,
                            background: isActive ? "rgba(89,128,212,0.12)" : "rgba(255,255,255,0.03)",
                            opacity: isActive ? 1 : isPassed ? 0.95 : 0.55,
                            transition: "opacity 0.35s, border-color 0.35s, background 0.35s",
                          }}
                        >
                          <img src={logo.src} alt="" width={logoImg} height={logoImg} style={{ objectFit: "contain" }} />
                        </span>
                      ))}
                    </div>
                  ) : Lucide ? (
                    <Lucide
                      size={iconSz}
                      strokeWidth={1.75}
                      style={{ color: tone, flexShrink: 0, transition: "color 0.35s" }}
                      aria-hidden
                    />
                  ) : null}
                </div>

                <h4
                  style={{
                    margin: 0,
                    fontSize: prominent ? "18px" : "12.5px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: isActive ? C.fg : C.fgMuted,
                    lineHeight: 1.25,
                    transition: "color 0.35s",
                  }}
                >
                  {stage.title}
                </h4>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isActive ? C.termAmber : C.fgDim,
                    transition: "color 0.35s",
                  }}
                >
                  {isActive ? "active" : stage.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Rail, orb, and nodes share one track aligned to the grid above */}
        <div style={{ position: "relative", width: "100%", height: railH, boxSizing: "border-box" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: lineY,
              height: "2px",
              borderRadius: "1px",
              transform: "translateY(-50%)",
              background: `linear-gradient(90deg, ${C.border} 0%, ${C.accent}40 50%, ${C.border} 100%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {motionOn && (
            <div
              className="upload-pipeline-orb"
              aria-hidden
              style={{
                position: "absolute",
                top: lineY,
                left: `${((phase + 0.5) / STAGES.length) * 100}%`,
                width: prominent ? "16px" : "14px",
                height: prominent ? "16px" : "14px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #fff4b8, #c9a010)",
                boxShadow: prominent
                  ? "0 0 0 4px rgba(212, 175, 55, 0.4), 0 0 28px rgba(255, 214, 90, 0.55)"
                  : "0 0 0 3px rgba(212, 175, 55, 0.32), 0 0 20px rgba(255, 210, 80, 0.48)",
                transform: "translate(-50%, -50%)",
                transition: skipTransition ? "none" : "left 0.85s cubic-bezier(0.33, 1, 0.68, 1)",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          )}

          <div
            style={{
              ...gc,
              position: "absolute",
              inset: 0,
              alignItems: "center",
              height: "100%",
              margin: 0,
              pointerEvents: "none",
            }}
          >
            {STAGES.map((stage, i) => {
              const isActive = motionOn && phase === i;
              const isPassed = motionOn && phase > i;
              return (
                <div key={`${stage.id}-dot`} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: isActive ? C.accentBright : isPassed ? C.termGreen : C.bgHighlight,
                      border: `2px solid ${isActive ? C.accentBright : isPassed ? C.termGreen : C.border}`,
                      boxShadow: isActive ? `0 0 12px rgba(122,163,235,0.45)` : "none",
                      transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active stage detail */}
      <div
        aria-live="polite"
        style={{
          marginTop: prominent ? "24px" : "20px",
          padding: prominent ? "16px 18px" : "12px 14px",
          borderRadius: prominent ? "10px" : "8px",
          border: `1px solid ${motionOn && STAGES[phase]?.id === "verification" ? `${C.accent}45` : C.border}`,
          background: prominent ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.18)",
        }}
      >
        <p style={{ margin: 0, fontSize: prominent ? "14px" : "13px", lineHeight: 1.6, color: C.fgMuted }}>
          <strong style={{ color: C.fg, fontWeight: 600 }}>{active.title}.</strong> {active.panel}
        </p>
      </div>

      <style>{`
        .upload-pipeline-model-logo img {
          filter: brightness(0) invert(0.88);
          opacity: 0.95;
        }
        .upload-pipeline-step:hover,
        .upload-pipeline-step:focus-visible {
          background: rgba(89, 128, 212, 0.06);
        }
        .upload-pipeline-step:hover .upload-pipeline-tip,
        .upload-pipeline-step:focus-visible .upload-pipeline-tip {
          opacity: 1;
          visibility: visible;
        }
        @media (prefers-reduced-motion: reduce) {
          .upload-pipeline-orb {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
