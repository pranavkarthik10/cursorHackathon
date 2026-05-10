-- Global catalog: show community public insights plus each caller's own rows only.
-- Without team/org membership tables, non-public rows from other users stay hidden.
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
        else
          insights.visibility = 'public'
          or (
            requesting_user_id is not null
            and insights.created_by = requesting_user_id
          )
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

grant execute on function public.search_insights(text, integer, text, uuid, text[])
  to anon, authenticated, service_role;

alter table public.insights enable row level security;

drop policy if exists "insights_select_authenticated" on public.insights;
drop policy if exists "insights_select_anon_public" on public.insights;

create policy "insights_select_authenticated"
  on public.insights
  for select
  to authenticated
  using (
    visibility = 'public'
    or created_by = auth.uid()
  );

create policy "insights_select_anon_public"
  on public.insights
  for select
  to anon
  using (visibility = 'public');
