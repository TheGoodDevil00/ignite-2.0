begin;

alter table public.teams
  add column if not exists contact_detail text;

alter table public.players
  add column if not exists goals_total integer not null default 0,
  add column if not exists saves_total integer not null default 0;

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

alter table public.matches
  drop constraint if exists matches_bye_shape;

alter table public.matches
  add constraint matches_bye_shape check (
    (is_bye and bye_team_id is not null and away_team_id is null)
    or
    (not is_bye and bye_team_id is null)
  );

create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id bigint not null references public.matches(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete cascade,
  goals integer not null default 0 check (goals >= 0),
  saves integer not null default 0 check (saves >= 0),
  created_at timestamptz default now(),
  unique (match_id, player_id)
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

grant select on public.player_match_stats to anon, authenticated;
grant all on public.player_match_stats to authenticated;
grant all on public.teams, public.players, public.matches to authenticated;

alter table public.matches replica identity full;
alter table public.match_scores replica identity full;
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

notify pgrst, 'reload schema';

commit;
