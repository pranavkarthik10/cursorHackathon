"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Loader2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  problem: string;
  environment: string | null;
  fix: string;
  visibility: string;
  rank?: number;
  created_at: string;
};

type Scope = "global" | "mine";

function profileInitials(email: string, displayName?: string): string {
  const name = displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "?";
  return local.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
}

export function DashboardClient({
  email,
  avatarUrl,
  displayName
}: {
  email: string;
  avatarUrl?: string;
  displayName?: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const label = displayName?.trim() || email;

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const [scope, setScope] = useState<Scope>("global");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "team" | "private">(
    "all"
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState("");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  const fetchResults = useCallback(
    async (searchText: string) => {
      setLoading(true);
      setStatusLine("");
      const token = await getToken();
      const params = new URLSearchParams();
      if (searchText.trim()) {
        params.set("q", searchText.trim());
      }
      params.set("scope", scope);
      params.set("limit", "50");
      if (visibilityFilter !== "all") {
        params.set("visibility", visibilityFilter);
      }

      const response = await fetch(`/api/insights/search?${params}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        setResults([]);
        setStatusLine(data.error ?? "Search failed");
        setLoading(false);
        return;
      }

      const list = (data.results ?? []) as SearchResult[];
      setResults(list);
      setStatusLine(`${list.length} insight${list.length === 1 ? "" : "s"}`);
      setSelectedId((prev) => (prev && list.some((r) => r.id === prev) ? prev : list[0]?.id ?? null));
      setLoading(false);
    },
    [scope, visibilityFilter]
  );

  useEffect(() => {
    void fetchResults(queryRef.current);
  }, [scope, visibilityFilter, fetchResults]);

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[200px] md:flex-none lg:max-w-none">
              <Avatar className="size-10 shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-xs">{profileInitials(email, displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight">Insights</h1>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </div>

            <div className="order-last flex w-full min-w-0 md:order-none md:flex-1 md:justify-center">
              <div className="flex w-full max-w-2xl items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void fetchResults(query);
                      }
                    }}
                    placeholder="Search errors, stack traces, symptoms…"
                    className="h-10 pl-9"
                    aria-label="Search insights"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  className="shrink-0"
                  onClick={() => void fetchResults(query)}
                  disabled={loading}
                  aria-label="Run search"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="shrink-0 md:ml-auto"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 md:border-0 md:pt-0">
            <div
              className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
              role="group"
              aria-label="Insight scope"
            >
              <button
                type="button"
                onClick={() => setScope("global")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  scope === "global"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-3.5" aria-hidden />
                Global
              </button>
              <button
                type="button"
                onClick={() => setScope("mine")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  scope === "mine"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="size-3.5" aria-hidden />
                My insights
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="visibility-filter" className="text-xs text-muted-foreground">
                Visibility
              </label>
              <select
                id="visibility-filter"
                value={visibilityFilter}
                onChange={(e) =>
                  setVisibilityFilter(e.target.value as "all" | "public" | "team" | "private")
                }
                className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="team">Team</option>
                <option value="private">Private</option>
              </select>
            </div>

            <p className="w-full text-xs text-muted-foreground md:ml-auto md:w-auto">
              {statusLine}
              {scope === "global" ? " · Community catalog" : " · Your published insights"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 lg:flex-row">
        <div className="min-h-[50vh] flex-1 overflow-auto border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Problem</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Environment</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Updated</th>
                <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Match</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    No insights match these filters. Try another search or switch scope.
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-b border-border/80 transition-colors hover:bg-accent/40",
                      selectedId === row.id && "bg-accent/50"
                    )}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="max-w-[220px] px-4 py-3 font-medium">
                      <span className="line-clamp-2">{row.title}</span>
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-muted-foreground sm:table-cell">
                      <span className="line-clamp-2">{row.problem}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      <span className="line-clamp-2">{row.environment ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="font-mono text-[10px] uppercase">{row.visibility}</Badge>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted-foreground xl:table-cell">
                      {row.rank != null && row.rank > 0 ? row.rank.toFixed(3) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="w-full shrink-0 border-t border-border bg-card/30 lg:w-[380px] lg:border-t-0">
          <div className="p-4 lg:sticky lg:top-28 lg:max-h-[calc(100svh-7rem)] lg:overflow-auto">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected insight
                  </p>
                  <h2 className="mt-1 text-base font-semibold leading-snug">{selected.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="font-mono text-[10px] uppercase">{selected.visibility}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Problem
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {selected.problem}
                  </p>
                </div>
                {selected.environment ? (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Environment
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.environment}</p>
                  </div>
                ) : null}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Fix
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{selected.fix}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a row to read the full problem and fix.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return iso;
  }
}
