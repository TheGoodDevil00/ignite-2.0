begin;

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

create index if not exists teams_captain_id_idx on public.teams (captain_id);
create index if not exists matches_home_team_id_idx on public.matches (home_team_id);
create index if not exists matches_away_team_id_idx on public.matches (away_team_id);
create index if not exists matches_bye_team_id_idx on public.matches (bye_team_id);
create index if not exists match_scores_updated_by_idx on public.match_scores (updated_by);
create index if not exists site_config_updated_by_idx on public.site_config (updated_by);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

create policy "profiles_admin_delete"
  on public.profiles for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_teams" on public.teams;
create policy "teams_admin_insert"
  on public.teams for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "teams_admin_update"
  on public.teams for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

create policy "teams_admin_delete"
  on public.teams for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_rounds" on public.rounds;
create policy "rounds_admin_insert"
  on public.rounds for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "rounds_admin_update"
  on public.rounds for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

create policy "rounds_admin_delete"
  on public.rounds for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_matches" on public.matches;
drop policy if exists "scorers_update_matches" on public.matches;

create policy "matches_admin_insert"
  on public.matches for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "matches_admin_or_scorer_update"
  on public.matches for update
  to authenticated
  using (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'scorer'
      and (scorer_id = (select auth.uid()) or scorer_id is null)
    )
  )
  with check (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'scorer'
      and (scorer_id = (select auth.uid()) or scorer_id is null)
    )
  );

create policy "matches_admin_delete"
  on public.matches for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_match_scores" on public.match_scores;
drop policy if exists "scorers_insert_match_scores" on public.match_scores;
drop policy if exists "scorers_update_match_scores" on public.match_scores;

create policy "match_scores_admin_or_scorer_insert"
  on public.match_scores for insert
  to authenticated
  with check (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'scorer'
      and updated_by = (select auth.uid())
      and exists (
        select 1
        from public.matches m
        where m.id = match_id
          and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
      )
    )
  );

create policy "match_scores_admin_or_scorer_update"
  on public.match_scores for update
  to authenticated
  using (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'scorer'
      and exists (
        select 1
        from public.matches m
        where m.id = match_id
          and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
      )
    )
  )
  with check (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'scorer'
      and updated_by = (select auth.uid())
      and exists (
        select 1
        from public.matches m
        where m.id = match_id
          and (m.scorer_id = (select auth.uid()) or m.scorer_id is null)
      )
    )
  );

create policy "match_scores_admin_delete"
  on public.match_scores for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

drop policy if exists "admin_all_site_config" on public.site_config;
create policy "site_config_admin_insert"
  on public.site_config for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "site_config_admin_update"
  on public.site_config for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

create policy "site_config_admin_delete"
  on public.site_config for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');

commit;
