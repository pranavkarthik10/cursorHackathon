create extension if not exists vector;

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  problem text not null,
  environment text,
  fix text not null,
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  created_by uuid references auth.users(id) on delete set null,
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

create or replace function public.search_insights(
  search_query text,
  result_limit int default 5,
  search_scope text default 'global',
  requesting_user_id uuid default null,
  filter_visibilities text[] default null
)
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
    case
      when trim(coalesce(search_query, '')) = '' then 0::real
      else ts_rank_cd(insights.search_vector, plainto_tsquery('english', search_query))
    end as rank,
    insights.created_at
  from public.insights
  where
    case
      when trim(coalesce(search_query, '')) = '' then true
      else insights.search_vector @@ plainto_tsquery('english', search_query)
    end
    and (
      case coalesce(nullif(trim(search_scope), ''), 'global')
        when 'mine' then
          requesting_user_id is not null
          and insights.created_by = requesting_user_id
        else insights.visibility in ('public', 'team')
      end
    )
    and (
      filter_visibilities is null
      or cardinality(filter_visibilities) = 0
      or insights.visibility = any(filter_visibilities)
    )
  order by rank desc, insights.created_at desc
  limit result_limit;
$$;
