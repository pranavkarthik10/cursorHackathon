"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Globe, Lock, LogOut, Maximize2, Search, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Visibility = "public" | "org" | "team" | "private";

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

const VISIBILITY_META: Record<
  Visibility,
  {
    label: string;
    icon: typeof Globe;
    dot: string;
    pill: string;
    description: string;
  }
> = {
  public: {
    label: "Public",
    icon: Globe,
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    description: "Everyone in the catalog"
  },
  org: {
    label: "Org",
    icon: Building2,
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    description: "Org-wide sharing not wired yet — others cannot see your non-public rows"
  },
  team: {
    label: "Team",
    icon: Users,
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    description: "Team sharing not wired yet — others cannot see your non-public rows"
  },
  private: {
    label: "Private",
    icon: Lock,
    dot: "bg-zinc-500",
    pill: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
    description: "Only you"
  }
};

const VISIBILITY_ORDER: Visibility[] = ["public", "org", "team", "private"];

type MatchTier = "high" | "medium" | "low";

function useMatchTierBounds(results: SearchResult[]) {
  return useMemo(() => {
    const positive = results
      .map((r) => r.rank)
      .filter((r): r is number => typeof r === "number" && r > 0);
    if (positive.length === 0) return null;
    return { min: Math.min(...positive), max: Math.max(...positive) };
  }, [results]);
}

function rankToMatchTier(rank: number | undefined, bounds: { min: number; max: number } | null): MatchTier | null {
  if (bounds == null || rank == null || rank <= 0) return null;
  if (bounds.max === bounds.min) return "high";
  const n = (rank - bounds.min) / (bounds.max - bounds.min);
  if (n >= 2 / 3) return "high";
  if (n >= 1 / 3) return "medium";
  return "low";
}

const MATCH_TIER_META: Record<
  MatchTier,
  { label: string; dot: string; text: string }
> = {
  high: {
    label: "High",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400"
  },
  medium: {
    label: "Med",
    dot: "bg-amber-500",
    text: "text-amber-800 dark:text-amber-400"
  },
  low: {
    label: "Low",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    text: "text-muted-foreground"
  }
};

function MatchTierIndicator({ tier }: { tier: MatchTier | null }) {
  if (!tier) {
    return <span className="text-muted-foreground">—</span>;
  }
  const meta = MATCH_TIER_META[tier];
  return (
    <span
      className={cn("inline-flex items-center justify-end gap-1.5 text-xs font-medium", meta.text)}
      title="How strongly this row matches your search, compared to other results in this list."
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

function isVisibility(value: string): value is Visibility {
  return value === "public" || value === "org" || value === "team" || value === "private";
}

function VisibilityBadge({ value }: { value: string }) {
  const meta = isVisibility(value) ? VISIBILITY_META[value] : null;
  if (!meta) {
    return (
      <Badge className="gap-1.5 border-border bg-secondary font-mono text-[10px] font-normal uppercase">
        {value}
      </Badge>
    );
  }
  return (
    <Badge
      className={cn(
        "gap-1.5 border font-mono text-[10px] font-normal uppercase tracking-wide",
        meta.pill
      )}
    >
      <span className={cn("inline-block size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

function InsightSections({
  insight,
  density
}: {
  insight: SearchResult;
  density: "sidebar" | "modal";
}) {
  const sectionLabel = density === "modal" ? "text-sm font-medium text-muted-foreground" : "text-xs font-medium text-muted-foreground";
  const problemBody =
    density === "modal"
      ? "mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground"
      : "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground";
  const envBody = density === "modal" ? "mt-2 text-base text-muted-foreground" : "mt-2 text-sm text-muted-foreground";
  const fixBody =
    density === "modal"
      ? "mt-2 whitespace-pre-wrap text-base leading-relaxed"
      : "mt-2 whitespace-pre-wrap text-sm leading-relaxed";

  return (
    <div className="space-y-5">
      <div>
        <h3 className={sectionLabel}>Problem</h3>
        <p className={problemBody}>{insight.problem}</p>
      </div>
      {insight.environment ? (
        <div>
          <h3 className={sectionLabel}>Environment</h3>
          <p className={envBody}>{insight.environment}</p>
        </div>
      ) : null}
      <div>
        <h3 className={sectionLabel}>Fix</h3>
        <p className={fixBody}>{insight.fix}</p>
      </div>
    </div>
  );
}

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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const label = displayName?.trim() || email.split("@")[0] || "Account";

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const [scope, setScope] = useState<Scope>("global");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
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
      if (visibilityFilter.length > 0 && visibilityFilter.length < VISIBILITY_ORDER.length) {
        params.set("visibility", visibilityFilter.join(","));
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

  const visibleVisibilities: Visibility[] =
    scope === "mine" ? VISIBILITY_ORDER : VISIBILITY_ORDER.filter((v) => v !== "private");

  useEffect(() => {
    setVisibilityFilter((prev) => prev.filter((v) => visibleVisibilities.includes(v)));
  }, [scope]);

  const visibilityFilterActive =
    visibilityFilter.length > 0 && visibilityFilter.length < visibleVisibilities.length;

  const selected = results.find((r) => r.id === selectedId) ?? null;
  const matchTierBounds = useMatchTierBounds(results);
  const selectedMatchTier = selected ? rankToMatchTier(selected.rank, matchTierBounds) : null;

  useEffect(() => {
    if (!selected) setDetailModalOpen(false);
  }, [selected]);
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1600px] items-center gap-4 px-7 md:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center font-mono text-lg font-medium tracking-tight text-primary"
          >
            agent-insights
          </Link>

          <div className="mx-auto flex min-w-0 max-w-xl flex-1 justify-center lg:max-w-2xl">
            <div className="relative w-full">
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
                className="h-10 border-border bg-secondary/80 pl-9 font-sans text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-primary"
                aria-label="Search insights"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Account menu"
                >
                  <Avatar className="size-10 border border-border">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback className="text-xs font-medium">
                      {profileInitials(email, displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="truncate text-xs leading-none text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => void supabase.auth.signOut()}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 border-t border-border px-7 py-2.5">
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => {
              if (v) setScope(v as Scope);
            }}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-secondary/80 p-1"
            size="sm"
          >
            <ToggleGroupItem value="global" aria-label="Global catalog" className="h-7 gap-1.5 rounded-md px-3 text-xs">
              <Globe className="size-3.5" aria-hidden />
              Global
            </ToggleGroupItem>
            <ToggleGroupItem value="mine" aria-label="My insights" className="h-7 gap-1.5 rounded-md px-3 text-xs">
              <User className="size-3.5" aria-hidden />
              Mine
            </ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Visibility</span>
            <ToggleGroup
              type="multiple"
              value={visibilityFilter}
              onValueChange={(v) =>
                setVisibilityFilter(v.filter(isVisibility) as Visibility[])
              }
              className="inline-flex h-9 items-center rounded-lg border border-border bg-secondary/80 p-1"
              size="sm"
              aria-label="Filter by visibility"
            >
              {visibleVisibilities.map((v) => {
                const meta = VISIBILITY_META[v];
                const Icon = meta.icon;
                return (
                  <ToggleGroupItem
                    key={v}
                    value={v}
                    aria-label={`${meta.label} — ${meta.description}`}
                    className="h-7 gap-1.5 rounded-md px-2.5 text-xs"
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {meta.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            {visibilityFilterActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setVisibilityFilter([])}
              >
                Clear
              </Button>
            ) : null}
          </div>

          <p className="ml-auto text-xs text-muted-foreground">
            {statusLine}
            <span className="text-border"> · </span>
            {scope === "global" ? "Community" : "Your insights"}
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-0 lg:flex-row lg:gap-0">
        <div className="min-h-[50vh] flex-1 overflow-auto px-7 py-5 lg:min-h-0 lg:border-r lg:border-border lg:py-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Problem</th>
                  <th className="hidden px-4 py-3 md:table-cell">Environment</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Updated</th>
                  <th className="hidden px-4 py-3 text-right xl:table-cell">Relevance</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      No insights match these filters. Try another search or switch scope.
                    </td>
                  </tr>
                ) : (
                  results.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "cursor-pointer border-b border-border/80 transition-colors last:border-b-0 hover:bg-secondary/60",
                        selectedId === row.id && "bg-secondary/90"
                      )}
                      onClick={() => setSelectedId(row.id)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        setSelectedId(row.id);
                        setDetailModalOpen(true);
                      }}
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
                        <VisibilityBadge value={row.visibility} />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="hidden px-4 py-3 text-right xl:table-cell">
                        <MatchTierIndicator tier={rankToMatchTier(row.rank, matchTierBounds)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="w-full shrink-0 px-7 py-5 lg:w-[400px] lg:py-6">
          <Card className="rounded-lg border-border bg-card shadow-none lg:sticky lg:top-[7.25rem] lg:max-h-[calc(100svh-8rem)] lg:overflow-auto">
            <div className="p-5">
              {selected ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">// detail</p>
                      <h2 className="mt-2 text-base font-semibold leading-snug tracking-tight">{selected.title}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <VisibilityBadge value={selected.visibility} />
                        <span className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</span>
                        {selectedMatchTier ? (
                          <span className="text-xs text-muted-foreground">
                            <span className="mr-1.5">·</span>
                            <MatchTierIndicator tier={selectedMatchTier} />
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 border-border bg-secondary/80 font-mono text-xs shadow-none"
                      onClick={() => setDetailModalOpen(true)}
                      aria-label="Open insight in large window"
                    >
                      <Maximize2 className="size-3.5" aria-hidden />
                      Expand
                    </Button>
                  </div>
                  <Separator />
                  <InsightSections insight={selected} density="sidebar" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a row to read the full problem and fix.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="flex max-h-[min(92vh,920px)] flex-col gap-0 border-border bg-card p-0 sm:max-w-4xl lg:max-w-6xl">
          {selected ? (
            <>
              <DialogHeader className="shrink-0 space-y-0 border-b border-border px-6 py-5 pr-14">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">// insight</p>
                <DialogTitle className="mt-2 text-left text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {selected.title}
                </DialogTitle>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <VisibilityBadge value={selected.visibility} />
                  <span className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</span>
                  {selectedMatchTier ? (
                    <span className="text-xs text-muted-foreground">
                      <span className="mr-1.5">·</span>
                      <MatchTierIndicator tier={selectedMatchTier} />
                    </span>
                  ) : null}
                </div>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <InsightSections insight={selected} density="modal" />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
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
