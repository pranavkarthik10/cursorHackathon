-- Hybrid search: Postgres FTS plus optional pgvector cosine similarity when query_embedding is supplied.
-- Rows need non-null embedding for semantic matches (set at publish time).

drop function if exists public.search_insights(text, integer, text, uuid, text[]);

create or replace function public.search_insights(
  search_query text,
  result_limit int default 5,
  search_scope text default 'global',
  requesting_user_id uuid default null,
  filter_visibilities text[] default null,
  query_embedding vector(1536) default null
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
      when query_embedding is null then
        ts_rank_cd(insights.search_vector, plainto_tsquery('english', search_query))
      when insights.embedding is null then
        case
          when insights.search_vector @@ plainto_tsquery('english', search_query)
          then ts_rank_cd(insights.search_vector, plainto_tsquery('english', search_query))
          else 0::real
        end
      else
        (
          case
            when insights.search_vector @@ plainto_tsquery('english', search_query)
            then ts_rank_cd(insights.search_vector, plainto_tsquery('english', search_query))
            else 0::real
          end
        ) * 0.35::real
        + (1::real - (insights.embedding <=> query_embedding)::real) * 0.65::real
    end as rank,
    insights.created_at
  from public.insights
  where
    case
      when trim(coalesce(search_query, '')) = '' then true
      else (
        insights.search_vector @@ plainto_tsquery('english', search_query)
        or (
          query_embedding is not null
          and insights.embedding is not null
          and (1::real - (insights.embedding <=> query_embedding)::real) >= 0.32::real
        )
      )
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

grant execute on function public.search_insights(text, integer, text, uuid, text[], vector)
  to anon, authenticated, service_role;
