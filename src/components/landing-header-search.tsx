"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

const C = {
  bgElevated: "#111318",
  border: "#1e2230",
  fg: "#e8ecf4",
  fgMuted: "#7a8499",
  accentBright: "#7aa3eb"
} as const;

type PublicResult = {
  id: string;
  title: string;
  problem: string;
  environment: string | null;
  fix: string;
  rank?: number;
};

export function LandingHeaderSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PublicResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: trimmed, limit: "12" });
      const res = await fetch(`/api/insights/search/public?${params}`);
      const data = (await res.json()) as { error?: string; results?: PublicResult[] };
      if (!res.ok) {
        setResults([]);
        setError(data.error ?? "Search failed");
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setResults([]);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 380);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: "1 1 200px", maxWidth: "420px", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          height: "36px",
          padding: "0 10px 0 12px",
          borderRadius: "8px",
          border: `1px solid ${C.border}`,
          background: C.bgElevated
        }}
      >
        <Search size={15} style={{ color: C.fgMuted, flexShrink: 0 }} aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runSearch(q);
              setOpen(true);
            }
          }}
          placeholder="Search public insights…"
          aria-label="Search public catalog"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: C.fg,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "12.5px"
          }}
        />
        {loading ? (
          <span style={{ fontSize: "10px", color: C.fgMuted, fontFamily: "var(--font-jetbrains), monospace" }}>
            …
          </span>
        ) : null}
      </div>

      {showPanel ? (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: "min(70vh, 320px)",
            overflowY: "auto",
            borderRadius: "8px",
            border: `1px solid ${C.border}`,
            background: C.bgElevated,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            zIndex: 50
          }}
        >
          {loading && !error && results.length === 0 ? (
            <p style={{ margin: 0, padding: "12px 14px", fontSize: "12px", color: C.fgMuted, fontFamily: "var(--font-jetbrains), monospace" }}>
              Searching…
            </p>
          ) : null}
          {error ? (
            <p style={{ margin: 0, padding: "12px 14px", fontSize: "12px", color: "#c97a7a", fontFamily: "var(--font-jetbrains), monospace" }}>
              {error}
            </p>
          ) : null}
          {!loading && !error && q.trim().length >= 2 && results.length === 0 ? (
            <p style={{ margin: 0, padding: "12px 14px", fontSize: "12px", color: C.fgMuted, fontFamily: "var(--font-jetbrains), monospace" }}>
              No public insights match. Try different keywords or sign in to search your workspace.
            </p>
          ) : null}
          {results.map((r) => (
            <div
              key={r.id}
              role="option"
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${C.border}`,
                cursor: "default"
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: C.fg, lineHeight: 1.35 }}>{r.title}</p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "11px",
                  color: C.fgMuted,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {r.problem}
              </p>
              {r.environment ? (
                <p style={{ margin: "6px 0 0", fontSize: "10px", color: C.fgMuted, opacity: 0.85 }}>{r.environment}</p>
              ) : null}
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "11px",
                  color: C.accentBright,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                Fix: {r.fix}
              </p>
            </div>
          ))}
          {results.length > 0 ? (
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
              <Link
                href="/login"
                style={{ fontSize: "11px", color: "#5980d4", fontFamily: "var(--font-jetbrains), monospace", textDecoration: "none" }}
              >
                Sign in for full workspace →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
