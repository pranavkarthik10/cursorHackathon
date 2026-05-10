"use client";

import { useState } from "react";
import { Search, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  title: string;
  problem: string;
  environment: string | null;
  fix: string;
  visibility: string;
  rank?: number;
};

export function DashboardClient({ email }: { email: string }) {
  const supabase = createSupabaseBrowserClient();
  const [transcript, setTranscript] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState("Ready");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function publish() {
    setStatus("Publishing insight...");
    const token = await getToken();
    const response = await fetch("/api/insights/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ transcript, visibility: "private" })
    });
    const data = await response.json();
    setStatus(response.ok ? `Published: ${data.insight.title}` : data.error);
  }

  async function search() {
    setStatus("Searching...");
    const token = await getToken();
    const response = await fetch(`/api/insights/search?q=${encodeURIComponent(query)}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const data = await response.json();
    setResults(data.results ?? []);
    setStatus(response.ok ? `${data.results.length} result(s)` : data.error);
  }

  return (
    <main className="min-h-svh px-5 py-5 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">Coding Agent Insights</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={16} className="text-primary" />
            {status}
          </span>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <section className="grid gap-5 py-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Publish Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste a solved session, terminal excerpt, or final fix notes..."
              className="min-h-72 font-mono"
            />
            <Button onClick={publish} disabled={!transcript.trim()}>
              <Send size={16} /> Publish private insight
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Fixes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="process is not defined in edge middleware"
              />
              <Button size="icon" onClick={search} disabled={!query.trim()} aria-label="Search">
                <Search size={18} />
              </Button>
            </div>
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="border-t border-border pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-medium">{result.title}</h2>
                    <span className="font-mono text-xs text-muted-foreground">{result.visibility}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{result.problem}</p>
                  <p className="mt-2 text-sm">{result.fix}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

