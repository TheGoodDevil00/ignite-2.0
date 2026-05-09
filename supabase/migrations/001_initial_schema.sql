begin;

create schema if not exists private;

do $$
begin
  create type public.user_role as enum ('admin', 'scorer', 'viewer');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.match_status as enum ('scheduled', 'live', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id bigint generated always as identity primary key,
  name text not null unique,
  "group" text,
  captain_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id bigint generated always as identity primary key,
  name text not null,
  jersey_number integer check (jersey_number is null or jersey_number between 0 and 999),
  team_id bigint not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, jersey_number)
);

alter table public.teams
  add constraint teams_captain_id_fkey
  foreign key (captain_id)
  references public.players(id)
  on delete set null;

create table if not exists public.rounds (
  id bigint generated always as identity primary key,
  name text not null,
  round_number integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  home_team_id bigint references public.teams(id) on delete restrict,
  away_team_id bigint references public.teams(id) on delete restrict,
  round_id bigint not null references public.rounds(id) on delete restrict,
  status public.match_status not null default 'scheduled',
  estimated_start timestamptz,
  venue_detail text,
  is_bye boolean not null default false,
  bye_team_id bigint references public.teams(id) on delete restrict,
  scorer_id uuid references public.profiles(id) on delete set null,
  match_number integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_distinct_teams check (
    home_team_id is null
    or away_team_id is null
    or home_team_id <> away_team_id
  ),
  constraint matches_bye_shape check (
    (is_bye and bye_team_id is not null and away_team_id is null)
    or
    (not is_bye and home_team_id is not null and away_team_id is not null and bye_team_id is null)
  )
);

create table if not exists public.match_scores (
  match_id bigint primary key references public.matches(id) on delete cascade,
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.site_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists teams_group_idx on public.teams ("group");
create index if not exists players_team_id_idx on public.players (team_id);
create index if not exists matches_round_id_idx on public.matches (round_id);
create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_estimated_start_idx on public.matches (estimated_start);
create index if not exists matches_scorer_id_idx on public.matches (scorer_id);
create index if not exists match_scores_updated_at_idx on public.match_scores (updated_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function private.set_updated_at();

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function private.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function private.set_updated_at();

drop trigger if exists match_scores_set_updated_at on public.match_scores;
create trigger match_scores_set_updated_at
  before update on public.match_scores
  for each row execute function private.set_updated_at();

drop trigger if exists site_config_set_updated_at on public.site_config;
create trigger site_config_set_updated_at
  before update on public.site_config
  for each row execute function private.set_updated_at();

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
$$;

revoke all on function private.current_user_role() from public;
grant execute on function private.current_user_role() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'viewer'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.matches enable row level security;
alter table public.match_scores enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or (select private.current_user_role()) = 'admin');

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "public_read_teams" on public.teams;
create policy "public_read_teams"
  on public.teams for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_rounds" on public.rounds;
create policy "public_read_rounds"
  on public.rounds for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_matches" on public.matches;
create policy "public_read_matches"
  on public.matches for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_match_scores" on public.match_scores;
create policy "public_read_match_scores"
  on public.match_scores for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_site_config" on public.site_config;
create policy "public_read_site_config"
  on public.site_config for select
  to anon, authenticated
  using (true);

drop policy if exists "admin_all_teams" on public.teams;
create policy "admin_all_teams"
  on public.teams for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_players" on public.players;
create policy "admin_all_players"
  on public.players for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_rounds" on public.rounds;
create policy "admin_all_rounds"
  on public.rounds for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_matches" on public.matches;
create policy "admin_all_matches"
  on public.matches for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_match_scores" on public.match_scores;
create policy "admin_all_match_scores"
  on public.match_scores for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_site_config" on public.site_config;
create policy "admin_all_site_config"
  on public.site_config for all
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

drop policy if exists "scorers_update_matches" on public.matches;
create policy "scorers_update_matches"
  on public.matches for update
  to authenticated
  using (
    (select private.current_user_role()) = 'scorer'
    and (scorer_id = (select auth.uid()) or scorer_id is null)
  )
  with check (
    (select private.current_user_role()) = 'scorer'
    and (scorer_id = (select auth.uid()) or scorer_id is null)
  );

drop policy if exists "scorers_insert_match_scores" on public.match_scores;
create policy "scorers_insert_match_scores"
  on public.match_scores for insert
  to authenticated
  with check (
    (select private.current_user_role()) = 'scorer'
    and updated_by = (select auth.uid())
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  );

drop policy if exists "scorers_update_match_scores" on public.match_scores;
create policy "scorers_update_match_scores"
  on public.match_scores for update
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
    and updated_by = (select auth.uid())
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.teams, public.rounds, public.matches, public.match_scores, public.site_config to anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles, public.teams, public.players, public.rounds, public.matches, public.match_scores, public.site_config to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.matches replica identity full;
alter table public.match_scores replica identity full;
alter table public.site_config replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'matches'
    ) then
      alter publication supabase_realtime add table public.matches;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'match_scores'
    ) then
      alter publication supabase_realtime add table public.match_scores;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'site_config'
    ) then
      alter publication supabase_realtime add table public.site_config;
    end if;
  end if;
end
$$;

insert into public.site_config (key, value)
values
  ('site_locked', 'true'),
  ('unlock_date', '2026-05-15T18:00:00+05:30'),
  ('event_date_display', '25-30 May'),
  ('whatsapp_link', 'https://wa.me/'),
  ('announcement_banner', ''),
  ('prize_pool', 'Rs 4500')
on conflict (key) do nothing;

commit;
