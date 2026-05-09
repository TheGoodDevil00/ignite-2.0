begin;

drop policy if exists "public_read_teams" on public.teams;
drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams"
  on public.teams for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_players" on public.players;
drop policy if exists "Public read players" on public.players;
create policy "Public read players"
  on public.players for select
  to anon, authenticated
  using (true);

grant select on public.teams, public.players to anon, authenticated;

commit;
