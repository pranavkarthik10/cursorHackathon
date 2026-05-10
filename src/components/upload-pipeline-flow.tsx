"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, ShieldCheck, Store, Upload } from "lucide-react";

const C = {
  bgElevated: "#111318",
  bgHighlight: "#191c23",
  fg: "#e8ecf4",
  fgMuted: "#7a8499",
  accent: "#5980d4",
  accentBright: "#7aa3eb",
  border: "#1e2230",
  termGreen: "#5abf7a",
  termAmber: "#c4953a",
  fgDim: "#3a404e",
} as const;

const STEP_MS = 3400;

/** Monochrome SVGs (Simple Icons, MIT) — styled with CSS filter on dark UI */
const VERIFIER_LOGOS = [
  { src: "/logos/openai.svg", label: "OpenAI" },
  { src: "/logos/anthropic.svg", label: "Anthropic" },
  { src: "/logos/googlegemini.svg", label: "Gemini" },
] as const;

const STEPS = [
  {
    id: "upload" as const,
    title: "Upload",
    subtitle: "Multi-step ingest",
    icon: Upload,
    body: "Session or export is distilled into a card layer by layer. Nothing ships until you confirm each step.",
  },
  {
    id: "privacy" as const,
    title: "Privacy",
    subtitle: "Redaction",
    icon: Shield,
    body: "Secrets, tokens, emails, and repo paths are masked before preview while the card stays private to you.",
  },
  {
    id: "security" as const,
    title: "Security",
    subtitle: "Abuse checks",
    icon: ShieldCheck,
    body: "We scan for prompt-injection patterns, hidden instructions, and hostile payloads before anything is indexed.",
  },
  {
    id: "verification" as const,
    title: "Verification",
    subtitle: "Ensemble vote",
    icon: null,
    body: "Independent providers score coherence, safety, and usefulness. Ensemble voting decides marketplace eligibility.",
  },
  {
    id: "marketplace" as const,
    title: "Marketplace",
    subtitle: "Go live",
    icon: Store,
    body: "Cards that clear the vote become searchable. Borderline or rejected items stay team-only or private.",
  },
] as const;

export function UploadPipelineFlow() {
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
      setPhase((p) => (p + 1) % STEPS.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (prevPhase.current === STEPS.length - 1 && phase === 0) {
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
  const active = STEPS[phase]!;
  const lineY = 76;

  return (
    <div
      className="upload-pipeline-root"
      style={{
        marginTop: "36px",
        padding: "28px 22px 26px",
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        background: `linear-gradient(165deg, ${C.bgElevated} 0%, ${C.bgHighlight} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.accent,
          margin: "0 0 6px 0",
        }}
      >
        // publish pipeline
      </p>
      <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55, color: C.fgMuted, maxWidth: "720px" }}>
        Horizontal path from raw session to marketplace: the insight packet travels through privacy, security, a
        multi-model vote, then listing.
      </p>

      <div
        className="upload-pipeline-scroll"
        style={{
          marginTop: "22px",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "4px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          className="upload-pipeline-track-inner"
          style={{
            minWidth: "min(100%, 720px)",
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            position: "relative",
            padding: "0 20px 8px",
          }}
        >
          {/* horizontal rail */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "20px",
              right: "20px",
              top: lineY,
              height: "2px",
              borderRadius: "1px",
              background: `linear-gradient(90deg, ${C.border} 0%, ${C.accent}40 50%, ${C.border} 100%)`,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />

          {/* traveling orb */}
          {motionOn && (
            <div
              className="upload-pipeline-orb"
              aria-hidden
              style={{
                position: "absolute",
                top: lineY,
                left: `calc(20px + (100% - 40px) * ${(phase + 0.5) / STEPS.length})`,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, ${C.accentBright}, ${C.accent})`,
                boxShadow: `0 0 0 3px rgba(89,128,212,0.25), 0 0 22px rgba(122,163,235,0.45)`,
                transform: "translate(-50%, -50%)",
                transition: skipTransition ? "none" : "left 0.85s cubic-bezier(0.33, 1, 0.68, 1)",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          )}

          <div
            role="list"
            aria-label="Publish pipeline stages"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`,
              gap: "6px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {STEPS.map((step, i) => {
              const isActive = motionOn && phase === i;
              const isPassed = motionOn && phase > i;
              const LucideIcon = step.icon;

              return (
                <div
                  key={step.id}
                  role="listitem"
                  style={{
                    textAlign: "center",
                    minWidth: 0,
                    padding: "4px 2px 0",
                  }}
                >
                  <div
                    style={{
                      minHeight: "44px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    {step.id === "verification" ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          height: "28px",
                        }}
                      >
                        {VERIFIER_LOGOS.map((logo) => (
                          <span
                            key={logo.src}
                            title={logo.label}
                            className="upload-pipeline-model-logo"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "26px",
                              height: "26px",
                              borderRadius: "6px",
                              background: isActive ? "rgba(89,128,212,0.15)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isActive ? `${C.accent}55` : C.border}`,
                              transition: "background 0.35s, border-color 0.35s, opacity 0.35s",
                              opacity: isActive ? 1 : isPassed ? 0.95 : 0.55,
                            }}
                          >
                            <img
                              src={logo.src}
                              alt=""
                              width={16}
                              height={16}
                              style={{ objectFit: "contain" }}
                            />
                          </span>
                        ))}
                      </div>
                    ) : LucideIcon ? (
                      <LucideIcon
                        size={22}
                        strokeWidth={1.75}
                        style={{
                          color: isActive ? C.accentBright : isPassed ? C.termGreen : C.fgMuted,
                          flexShrink: 0,
                          transition: "color 0.35s",
                        }}
                        aria-hidden
                      />
                    ) : null}
                  </div>

                  <h4
                    style={{
                      margin: 0,
                      fontSize: "12.5px",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: isActive ? C.fg : C.fgMuted,
                      lineHeight: 1.25,
                      transition: "color 0.35s",
                    }}
                  >
                    {step.title}
                  </h4>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: "9px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: isActive ? C.termAmber : C.fgDim,
                      transition: "color 0.35s",
                    }}
                  >
                    {isActive ? "active" : step.subtitle}
                  </p>

                  {/* node on rail */}
                  <div style={{ height: "28px", position: "relative", marginTop: "4px" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: isActive ? C.accentBright : isPassed ? C.termGreen : C.bgHighlight,
                        border: `2px solid ${isActive ? C.accentBright : isPassed ? C.termGreen : C.border}`,
                        boxShadow: isActive ? `0 0 12px rgba(122,163,235,0.45)` : "none",
                        transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
                        zIndex: 2,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active stage copy */}
      <div
        aria-live="polite"
        style={{
          marginTop: "18px",
          padding: "14px 16px",
          borderRadius: "8px",
          border: `1px solid ${motionOn && phase === 3 ? `${C.accent}40` : C.border}`,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.65, color: C.fgMuted }}>
          <strong style={{ color: C.fg, fontWeight: 600 }}>{active.title}.</strong> {active.body}
        </p>
      </div>

      <style>{`
        .upload-pipeline-model-logo img {
          filter: brightness(0) invert(0.88);
          opacity: 0.95;
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
