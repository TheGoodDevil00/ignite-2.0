begin;

alter table public.matches
  add column if not exists winner_id bigint references public.teams(id) on delete restrict,
  add column if not exists next_match_id bigint references public.matches(id) on delete set null,
  add column if not exists next_match_slot text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_next_match_slot_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_next_match_slot_check
      check (next_match_slot in ('home', 'away') or next_match_slot is null);
  end if;
end
$$;

alter table public.teams
  add column if not exists contact_detail text;

create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id bigint not null references public.matches(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete cascade,
  goals integer not null default 0 check (goals >= 0),
  saves integer not null default 0 check (saves >= 0),
  created_at timestamptz default now(),
  unique (match_id, player_id)
);

alter table public.players
  add column if not exists goals_total integer not null default 0,
  add column if not exists saves_total integer not null default 0;

alter table public.matches
  drop constraint if exists matches_bye_shape;

alter table public.matches
  add constraint matches_bye_shape check (
    (is_bye and bye_team_id is not null and away_team_id is null)
    or
    (not is_bye and bye_team_id is null)
  );

create index if not exists matches_winner_id_idx on public.matches (winner_id);
create index if not exists matches_next_match_id_idx on public.matches (next_match_id);
create index if not exists player_match_stats_match_id_idx on public.player_match_stats (match_id);
create index if not exists player_match_stats_player_id_idx on public.player_match_stats (player_id);

alter table public.player_match_stats enable row level security;

drop policy if exists "public_read_player_match_stats" on public.player_match_stats;
create policy "public_read_player_match_stats"
  on public.player_match_stats for select
  to anon, authenticated
  using (true);

drop policy if exists "player_match_stats_admin_insert" on public.player_match_stats;
create policy "player_match_stats_admin_insert"
  on public.player_match_stats for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "player_match_stats_admin_update" on public.player_match_stats;
create policy "player_match_stats_admin_update"
  on public.player_match_stats for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "player_match_stats_admin_delete" on public.player_match_stats;
create policy "player_match_stats_admin_delete"
  on public.player_match_stats for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "player_match_stats_scorer_insert" on public.player_match_stats;
create policy "player_match_stats_scorer_insert"
  on public.player_match_stats for insert
  to authenticated
  with check (
    (select private.current_user_role()) = 'scorer'
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  );

drop policy if exists "player_match_stats_scorer_update" on public.player_match_stats;
create policy "player_match_stats_scorer_update"
  on public.player_match_stats for update
  to authenticated
  using (
    (select private.current_user_role()) = 'scorer'
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  )
  with check (
    (select private.current_user_role()) = 'scorer'
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  );

drop policy if exists "player_match_stats_scorer_delete" on public.player_match_stats;
create policy "player_match_stats_scorer_delete"
  on public.player_match_stats for delete
  to authenticated
  using (
    (select private.current_user_role()) = 'scorer'
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  );

grant select on public.player_match_stats to anon, authenticated;
grant all on public.player_match_stats to authenticated;

create or replace function public.create_bracket_fixtures(
  p_teams jsonb,
  p_rounds jsonb,
  p_matches jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  team_ids jsonb := '{}'::jsonb;
  round_ids jsonb := '{}'::jsonb;
  match_ids jsonb := '{}'::jsonb;
  inserted_matches jsonb := '[]'::jsonb;
  team_id bigint;
  round_id bigint;
  match_id bigint;
  team_name text;
  local_key text;
  next_key text;
begin
  if jsonb_typeof(p_teams) <> 'array'
    or jsonb_typeof(p_rounds) <> 'array'
    or jsonb_typeof(p_matches) <> 'array' then
    raise exception 'Bracket payload must contain array values for teams, rounds, and matches.';
  end if;

  if exists (
    select 1
    from public.rounds r
    where r.round_number in (
      select (value ->> 'round_number')::integer
      from jsonb_array_elements(p_rounds)
    )
  ) then
    raise exception 'Bracket generation aborted: one or more rounds already exist.';
  end if;

  if exists (
    select 1
    from public.matches m
    where m.match_number in (
      select (value ->> 'match_number')::integer
      from jsonb_array_elements(p_matches)
    )
  ) then
    raise exception 'Bracket generation aborted: one or more matches already exist.';
  end if;

  for item in select value from jsonb_array_elements(p_teams) loop
    team_name := nullif(btrim(item ->> 'name'), '');

    if team_name is null then
      raise exception 'Team name cannot be blank.';
    end if;

    insert into public.teams (name, "group")
    values (team_name, null)
    on conflict (name) do update
      set "group" = excluded."group",
          updated_at = now()
    returning id into team_id;

    team_ids := jsonb_set(team_ids, array[team_name], to_jsonb(team_id), true);
  end loop;

  for item in select value from jsonb_array_elements(p_rounds) loop
    local_key := item ->> 'local_key';

    insert into public.rounds (name, round_number)
    values (item ->> 'name', (item ->> 'round_number')::integer)
    returning id into round_id;

    round_ids := jsonb_set(round_ids, array[local_key], to_jsonb(round_id), true);
  end loop;

  for item in select value from jsonb_array_elements(p_matches) loop
    local_key := item ->> 'local_key';

    insert into public.matches (
      home_team_id,
      away_team_id,
      round_id,
      status,
      estimated_start,
      venue_detail,
      is_bye,
      bye_team_id,
      match_number
    )
    values (
      case
        when nullif(item ->> 'home_team_name', '') is null then null
        else (team_ids ->> (item ->> 'home_team_name'))::bigint
      end,
      case
        when nullif(item ->> 'away_team_name', '') is null then null
        else (team_ids ->> (item ->> 'away_team_name'))::bigint
      end,
      (round_ids ->> (item ->> 'round_key'))::bigint,
      coalesce(item ->> 'status', 'scheduled')::public.match_status,
      nullif(item ->> 'estimated_start', '')::timestamptz,
      nullif(item ->> 'venue_detail', ''),
      false,
      null,
      (item ->> 'match_number')::integer
    )
    returning id into match_id;

    match_ids := jsonb_set(match_ids, array[local_key], to_jsonb(match_id), true);
    inserted_matches := inserted_matches || jsonb_build_array(
      jsonb_build_object(
        'local_key', local_key,
        'id', match_id,
        'match_number', (item ->> 'match_number')::integer
      )
    );
  end loop;

  for item in select value from jsonb_array_elements(p_matches) loop
    next_key := nullif(item ->> 'next_local_key', '');

    if next_key is not null then
      update public.matches
      set next_match_id = (match_ids ->> next_key)::bigint,
          next_match_slot = item ->> 'next_match_slot'
      where id = (match_ids ->> (item ->> 'local_key'))::bigint;
    end if;
  end loop;

  insert into public.match_scores (match_id, home_score, away_score)
  select (value ->> 'id')::bigint, 0, 0
  from jsonb_array_elements(inserted_matches);

  return jsonb_build_object(
    'teams', jsonb_array_length(p_teams),
    'rounds', jsonb_array_length(p_rounds),
    'matches', inserted_matches
  );
end;
$$;

create or replace function public.advance_match_winner(
  p_match_id bigint,
  p_winner_id bigint,
  p_slot_minutes integer default 30
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_match public.matches%rowtype;
  next_match public.matches%rowtype;
  next_home_id bigint;
  next_away_id bigint;
begin
  select *
  into completed_match
  from public.matches
  where id = p_match_id
  for update;

  if completed_match.id is null then
    raise exception 'Match % was not found.', p_match_id;
  end if;

  if p_winner_id is distinct from completed_match.home_team_id
    and p_winner_id is distinct from completed_match.away_team_id then
    raise exception 'Winner % is not assigned to match %.', p_winner_id, p_match_id;
  end if;

  update public.matches
  set winner_id = p_winner_id,
      status = 'completed'
  where id = p_match_id;

  if completed_match.next_match_id is null then
    return;
  end if;

  select *
  into next_match
  from public.matches
  where id = completed_match.next_match_id
  for update;

  if next_match.id is null then
    raise exception 'Next match % was not found.', completed_match.next_match_id;
  end if;

  if completed_match.next_match_slot = 'home' then
    update public.matches
    set home_team_id = p_winner_id
    where id = completed_match.next_match_id;
  elsif completed_match.next_match_slot = 'away' then
    update public.matches
    set away_team_id = p_winner_id
    where id = completed_match.next_match_id;
  else
    raise exception 'Match % has invalid next slot %.', p_match_id, completed_match.next_match_slot;
  end if;

  select home_team_id, away_team_id
  into next_home_id, next_away_id
  from public.matches
  where id = completed_match.next_match_id;

  if next_home_id is not null and next_away_id is not null then
    update public.matches
    set status = 'scheduled',
        estimated_start = case
          when completed_match.estimated_start is null then estimated_start
          else completed_match.estimated_start + make_interval(mins => p_slot_minutes)
        end
    where id = completed_match.next_match_id;
  end if;
end;
$$;

revoke execute on function public.create_bracket_fixtures(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.advance_match_winner(bigint, bigint, integer) from public, anon, authenticated;
grant execute on function public.create_bracket_fixtures(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.advance_match_winner(bigint, bigint, integer) to service_role;

insert into public.site_config (key, value) values
  ('fillout_link', ''),
  ('leaderboard_visible', 'false'),
  ('event_date_display', '26th July'),
  ('unlock_date', '2025-07-19T00:00:00+05:30')
on conflict (key) do nothing;

commit;
