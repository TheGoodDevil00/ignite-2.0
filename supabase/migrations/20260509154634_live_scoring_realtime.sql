begin;

create or replace function public.apply_player_match_stat_delta(
  p_match_id bigint,
  p_player_id bigint,
  p_stat text,
  p_delta integer,
  p_updated_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.matches%rowtype;
  player_team_id bigint;
  player_goals integer;
  player_saves integer;
  player_goals_total integer;
  player_saves_total integer;
  home_score integer;
  away_score integer;
begin
  if p_stat not in ('goals', 'saves') then
    raise exception 'Unsupported stat "%".', p_stat;
  end if;

  if p_delta = 0 then
    raise exception 'Stat delta cannot be zero.';
  end if;

  select *
  into target_match
  from public.matches
  where id = p_match_id
  for update;

  if target_match.id is null then
    raise exception 'Match % was not found.', p_match_id;
  end if;

  if target_match.status not in ('scheduled'::public.match_status, 'live'::public.match_status) then
    raise exception 'Stats can only be changed while a match is scheduled or live.';
  end if;

  select team_id
  into player_team_id
  from public.players
  where id = p_player_id
  for update;

  if player_team_id is null then
    raise exception 'Player % was not found.', p_player_id;
  end if;

  if player_team_id is distinct from target_match.home_team_id
    and player_team_id is distinct from target_match.away_team_id then
    raise exception 'Player % is not assigned to match %.', p_player_id, p_match_id;
  end if;

  insert into public.player_match_stats (match_id, player_id, goals, saves)
  values (
    p_match_id,
    p_player_id,
    case when p_stat = 'goals' then greatest(p_delta, 0) else 0 end,
    case when p_stat = 'saves' then greatest(p_delta, 0) else 0 end
  )
  on conflict (match_id, player_id) do update
    set goals = case
          when p_stat = 'goals' then greatest(public.player_match_stats.goals + p_delta, 0)
          else public.player_match_stats.goals
        end,
        saves = case
          when p_stat = 'saves' then greatest(public.player_match_stats.saves + p_delta, 0)
          else public.player_match_stats.saves
        end
  returning goals, saves
  into player_goals, player_saves;

  update public.players
  set goals_total = coalesce((
        select sum(stats.goals)::integer
        from public.player_match_stats stats
        where stats.player_id = p_player_id
      ), 0),
      saves_total = coalesce((
        select sum(stats.saves)::integer
        from public.player_match_stats stats
        where stats.player_id = p_player_id
      ), 0)
  where id = p_player_id
  returning goals_total, saves_total
  into player_goals_total, player_saves_total;

  select coalesce(sum(stats.goals), 0)::integer
  into home_score
  from public.player_match_stats stats
  join public.players players on players.id = stats.player_id
  where stats.match_id = p_match_id
    and players.team_id = target_match.home_team_id;

  select coalesce(sum(stats.goals), 0)::integer
  into away_score
  from public.player_match_stats stats
  join public.players players on players.id = stats.player_id
  where stats.match_id = p_match_id
    and players.team_id = target_match.away_team_id;

  insert into public.match_scores (match_id, home_score, away_score, updated_by)
  values (p_match_id, home_score, away_score, p_updated_by)
  on conflict (match_id) do update
    set home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_by = excluded.updated_by;

  return jsonb_build_object(
    'player_id', p_player_id,
    'goals', player_goals,
    'saves', player_saves,
    'goals_total', player_goals_total,
    'saves_total', player_saves_total,
    'home_score', home_score,
    'away_score', away_score
  );
end;
$$;

revoke execute on function public.apply_player_match_stat_delta(bigint, bigint, text, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.apply_player_match_stat_delta(bigint, bigint, text, integer, uuid)
  to service_role;

alter table public.player_match_stats replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'player_match_stats'
    ) then
      alter publication supabase_realtime add table public.player_match_stats;
    end if;
  end if;
end
$$;

commit;
