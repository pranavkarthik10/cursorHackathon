create extension if not exists vector;

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  problem text not null,
  environment text,
  fix text not null,
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  embedding vector(1536),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(problem, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(environment, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(fix, '')), 'B')
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists insights_search_idx on public.insights using gin (search_vector);
create index if not exists insights_created_at_idx on public.insights (created_at desc);

create or replace function public.search_insights(search_query text, result_limit int default 5)
returns table (
  id uuid,
  title text,
  problem text,
  environment text,
  fix text,
  visibility text,
  rank real,
  created_at timestamptz
)
language sql
stable
as $$
  select
    insights.id,
    insights.title,
    insights.problem,
    insights.environment,
    insights.fix,
    insights.visibility,
    ts_rank_cd(insights.search_vector, plainto_tsquery('english', search_query)) as rank,
    insights.created_at
  from public.insights
  where insights.search_vector @@ plainto_tsquery('english', search_query)
  order by rank desc, insights.created_at desc
  limit result_limit;
$$;
