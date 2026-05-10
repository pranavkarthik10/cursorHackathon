"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Globe, Lock, LogOut, Search, User, Users } from "lucide-react";
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
    description: "Your organization"
  },
  team: {
    label: "Team",
    icon: Users,
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    description: "Your team"
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
  const label = displayName?.trim() || email.split("@")[0] || "Account";

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const [scope, setScope] = useState<Scope>("global");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility[]>([]);
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

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 md:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-[10px] font-bold leading-none text-primary-foreground">
              CAI
            </span>
            <span className="hidden sm:inline">Coding Agent Insights</span>
            <span className="sm:hidden">Insights</span>
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
                className="h-9 border-border/80 bg-secondary/40 pl-9 shadow-none backdrop-blur-sm"
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
                  className="size-9 shrink-0 rounded-full ring-offset-background focus-visible:ring-2"
                  aria-label="Account menu"
                >
                  <Avatar className="size-9">
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

        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 border-t border-border/60 px-4 py-2.5 md:px-6">
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => {
              if (v) setScope(v as Scope);
            }}
            className="inline-flex h-9 items-center rounded-lg border border-border/80 bg-secondary/40 p-1"
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
              className="inline-flex h-9 items-center rounded-lg border border-border/80 bg-secondary/40 p-1"
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
        <div className="min-h-[50vh] flex-1 overflow-auto px-4 py-4 md:px-6 lg:min-h-0 lg:border-r lg:border-border/60 lg:py-5">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/50 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Problem</th>
                  <th className="hidden px-4 py-3 md:table-cell">Environment</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Updated</th>
                  <th className="hidden px-4 py-3 text-right xl:table-cell">Match</th>
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
                        "cursor-pointer border-b border-border/50 transition-colors last:border-b-0 hover:bg-accent/50",
                        selectedId === row.id && "bg-accent/60"
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
                        <VisibilityBadge value={row.visibility} />
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
        </div>

        <aside className="w-full shrink-0 px-4 py-4 md:px-6 lg:w-[400px] lg:py-5">
          <Card className="border-border/80 bg-card/40 shadow-none lg:sticky lg:top-[7.25rem] lg:max-h-[calc(100svh-8rem)] lg:overflow-auto">
            <div className="p-5">
              {selected ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Detail</p>
                    <h2 className="mt-2 text-base font-semibold leading-snug tracking-tight">{selected.title}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <VisibilityBadge value={selected.visibility} />
                      <span className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Problem</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {selected.problem}
                    </p>
                  </div>
                  {selected.environment ? (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">Environment</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{selected.environment}</p>
                    </div>
                  ) : null}
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Fix</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{selected.fix}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a row to read the full problem and fix.</p>
              )}
            </div>
          </Card>
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
